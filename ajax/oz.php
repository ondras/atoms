<?php
	function error_handler($no, $str, $file, $line) {
		throw new ErrorException($str, $no, 0, $file, $line);
	}
	set_error_handler("error_handler");

	/**
	 * Database helper class
	 */
	class DB {
		protected $db = null;
		
		public function __construct($dsn, $username = "", $password = "", $driver_options = array()) {
			$this->db = new PDO($dsn, $username, $password, $driver_options);
			$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		}
		
		public function query($query) {
			$values = func_get_args();
			array_shift($values);

			$s = $this->db->prepare($query);
			
			if (count($values) && is_array($values[0])) {
				$s->execute($values[0]);
			} else {
				$s->execute($values);
			}

			$s->setFetchMode(PDO::FETCH_ASSOC);
			
			if ($s->columnCount()) {
				return $s->fetchAll();
			} else {
				return true;
			}
				
		}
		
		public function insert($table, $values = array()) {
			$query = "INSERT INTO ".$table. "(";
			$query .= implode(",", array_keys($values));
			$query .= ") VALUES (";
			
			$params = array();
			foreach ($values as $value) {
				if (count($params)) { $query .= ","; }
				$params[] = $value;
				$query .= "?";
			}
			$query .= ")";
			$this->query($query, $params);
			return $this->db->lastInsertId();
		}
		
		public function update($table, $id, $values = array()) {
			$query = "UPDATE ".$table." SET ";
			$params = array();
			
			foreach ($values as $key=>$value) {
				if (count($params)) { $query .= ","; }
				$params[] = $value;
				$query .= $key."=?";
			}
			
			if ($id) {
				$id_name = "id";
				$id_value = $id;
				if (is_array($id)) {
					$keys = array_keys($id);
					$id_name = array_shift($keys);
					$id_value = $id[$id_name];
				}

				$query .= " WHERE ".$id_name." = ?";
				$params[] = $id_value;
			}

			return $this->query($query, $params);
		}
		
		public function delete($table, $id = null) {
			$query = "DELETE FROM ".$table;
			$params = array();
			
			if ($id) {
				$id_name = "id";
				$id_value = $id;
				if (is_array($id)) {
					$keys = array_keys($id);
					$id_name = array_shift($keys);
					$id_value = $id[$id_name];
				}
				
				$query .= " WHERE ".$id_name." = ?";
				$params[] = $id_value;
			}
			return $this->query($query, $params);
		}
		
	}
	
	/**
	 * XML (+XSLT) output class
	 */
	class XML {
		protected $filters = array();
		protected $template = null;
		protected $parameters = array();
		protected $xml = null;

		public function __construct() {
			$this->xml = new DOMDocument();
			$this->documentElement = $this->xml->createElement("data");
			$this->xml->appendChild($this->documentElement);
		}
		
		public function setTemplate($template) {
			$this->template = $template;
			return $this;
		}
		
		public function setParameter($name, $value) {
			$this->parameters[$name] = $value;
			return $this;
		}
		
		public function addData($name, $data) {
			$this->documentElement->appendChild($this->arrayToNode($data, $name));
			return $this;
		}
		
		public function addFilter($filter) {
			$this->filters[] = $filter;
			return $this;
		}
		
		public function toString() {
			$xml = null;
			if ($this->template) {
				$xsl = new DOMDocument();
				$xsl->load($this->template, LIBXML_NOCDATA);
				$xslt = new XSLTProcessor();
				$xslt->importStylesheet($xsl);
				foreach ($this->parameters as $name=>$value) {
					$xslt->setParameter("", $name, $value);
				}
				return $xslt->transformToXML($this->xml);
			} else {
				return $this->xml->saveXML();
			}
		}
		
		protected function arrayToNode($array, $nodeName) {
			$test = each($array);
			if (is_numeric($test[0])) {
				$frag = $this->xml->createDocumentFragment();
				foreach ($array as $item) {
					$frag->appendChild($this->arrayToNode($item, $nodeName));
				}
				return $frag;
			}
			
			$node = $this->xml->createElement($nodeName);
			foreach ($array as $name=>$value) {
				if (is_array($value)) {
					$node->appendChild($this->arrayToNode($value, $name));
				} else {
					$value = $this->filter($value);
					if ($name === "") {
						$node->appendChild($this->xml->createCDATASection($value));
					} else {
						$node->setAttribute($name, $value);
					}
				}
			}
			return $node;
		}

		protected function filter($str) {
			for ($i=0;$i<count($this->filters);$i++) {
				$str = $this->filters[$i]->apply($str);
			}
			return $str;
		}
	}
	
	/**
	 * Base web application
	 */
	class APP {
		protected $dispatch_table = array();

		public function __call($name, $arguments) {
			$this->error501();
		}

		protected function dispatch() {
			$method = strtolower($_SERVER["REQUEST_METHOD"]);
			$method = HTTP::value("http-method", "post", $method);

			$handler = "";
			$resource = substr($_SERVER["REQUEST_URI"], strlen(HTTP::$BASE));
			
			$qs = strpos($resource, "?");
			if ($qs !== false) { $resource = substr($resource, 0, $qs); }

			$resource_matched = false;
			do {
				foreach ($this->dispatch_table as $row) {
					$item = preg_split('/\s+/', $row);
					preg_match("#".$item[1]."#", $resource, $matches);
					if (!$matches) { continue; }
					$resource_matched = true;
					if (strtolower($item[0]) != $method) { continue; }
					$handler = $item[2];
					break;
				}
				
				if (!$handler) { 
					if ($resource_matched) {
						return $this->error405();
					} else {
						return $this->error404(); 
					}
				} /* does not exist in table */
				
				if (substr($handler, 0, 1) == "/") { /* alias to other resource */
					$resource = $handler;
					$handler = "";
				}
				
			} while (!$handler);
			
			$instance = $this;
			$dotpos = strpos($handler, ".");
			if ($dotpos !== false) {
				$class = substr($handler, 0, $dotpos);
				if (!class_exists($class)) { throw new ErrorException("Class '".$class."' not available", 0, 0, __FILE__, __LINE__); }
				$instance = new $class($this);
				$handler = substr($handler, $dotpos+1);
			}
			
			return $instance->$handler($matches);
		}

		public function error403() {
			HTTP::status(403);
			echo "<h1>403 Not Authorized</h1>";
		}

		public function error404() {
			HTTP::status(404);
			echo "<h1>404 Not Found</h1>";
		}
		
		public function error405() {
			HTTP::status(405);
			echo "<h1>405 Method Not Allowed</h1>";
		}

		public function error500() {
			HTTP::status(500);
			echo "<h1>500 Internal Server Error</h1>";
		}

		public function error501() {
			HTTP::status(501);
			echo "<h1>501 Not Implemented</h1>";
		}
	}
	
	/**
	 * Application extension - module class
	 */
	class MODULE {
		protected $app;
		
		public function __construct($app) {
			$this->app = $app;
		}
		
		public function __call($name, $arguments) {
			return call_user_func_array(array($this->app, $name), $arguments);
		}
	}

	/**
	 * Static HTTP helper
	 */
	class HTTP {
		public static $BASE = "";
		public static $REFERER = "";
		
		/**
		 * @param {string} name
		 * @param {string} where "get"/"post"/"cookie"/"files"
		 * @param {any} default Used when no value is specified; used to coerce return type
		 * @returns {typeof($default)}
		 */
		public static function value($name, $where, $default = null) {
			$value = $default;
			if (($where == "get") && isset($_GET[$name])) {
				$value = $_GET[$name];
			} elseif (($where == "post") && isset($_POST[$name])) {
				$value = $_POST[$name];
			} elseif (($where == "cookie") && isset($_COOKIE[$name])) {
				$value = $_COOKIE[$name];
			} elseif (($where == "files") && isset($_FILES[$name])) {
				$value = $_FILES[$name];
			} else {
				return $value;
			}
			
			if (!is_null($default)) { settype($value, gettype($default)); }
			return $value;
		}
		
		public static function redirect($location) {
			if (substr($location, 0, 1) == "/") {
				$location = self::$BASE . $location;
			}
			header("Location: " . $location);
		}
		
		public static function redirectBack() {
			self::redirect(self::$REFERER);
		}
		
		public static function status($code) {
			header("HTTP/1.1 " . $code, true, $code);
		}
	}

	if (isset($_SERVER["DOCUMENT_ROOT"]) && isset($_SERVER["SCRIPT_FILENAME"])) { /* detect base path */
		$root = $_SERVER["DOCUMENT_ROOT"];
		$cwd = dirname($_SERVER["SCRIPT_FILENAME"]);

		if ($root && strpos($cwd, $root) === 0) { /* found! */
			HTTP::$BASE = substr($cwd, strlen($root));
		}
	}
	
	if (isset($_SERVER["HTTP_REFERER"])) { HTTP::$REFERER = $_SERVER["HTTP_REFERER"]; }
	
	/**
	 * XML output filter
	 */
	class FILTER {
		public function __construct() {
		}

		public function apply($str) {
			return $str;
		}
	}
	
	class FILTER_TYPO extends FILTER {
		protected static $typo = array(
			"<->" => "↔",
			"->" => "→",
			"<-" => "←",
			"<=>" => "⇔",
			"=>" => "⇒",
			"<=" => "⇐",
			">>" => "»",
			"<<" => "«",
			"---" => "—",
			"--" => "–",
			"(c)" => "©",
			"(C)" => "©",
			"(tm)" => "™",
			"(TM)" => "™",
			"(r)" => "®",
			"(R)" => "®",
			"..." => "…"
		);
		
		public function apply($str) {
			$str = str_replace(array_keys(self::$typo), array_values(self::$typo), $str);
			return preg_replace("/(?<=\d)x(?=\d)/i", "×", $str);
		}
	}
	
	class FILTER_NBSP extends FILTER {
		public function apply($str) {
			return preg_replace("/(?<=\s)([A-Z]) (?=\S)/i", "$1".html_entity_decode("&nbsp;", ENT_QUOTES, "utf-8"), $str);
		}
	}

	class FILTER_FRACTIONS extends FILTER {
		protected $fractions = null;

		protected static $_fractions = array(
			"1/2" => "½",
			"1/4" => "¼",
			"3/4" => "¾",
			"1/3" => "⅓",
			"2/3" => "⅔",
			"1/5" => "⅕",
			"2/5" => "⅖",
			"3/5" => "⅗",
			"4/5" => "⅘",
			"1/6" => "⅙",
			"5/6" => "⅚",
			"1/8" => "⅛",
			"3/8" => "⅜",
			"5/8" => "⅝",
			"7/8" => "⅞"
		);
		
		public function __construct() {
			parent::__construct();
			$this->xml = new DOMDocument();
			foreach (self::$_fractions as $name=>$value) {
				$newname = "@(?<=[^\\d]|^)".$name."(?=[^\\d]|$)@";
				$this->fractions[$newname] = $value;
			}
		}

		public function apply($str) {
			return preg_replace(array_keys($this->fractions), array_values($this->fractions), $str);
		}
	}
?>
