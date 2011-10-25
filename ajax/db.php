<?php
	include("oz.php");

	class AtomsDB extends DB {
		const GAME		= "game";
		const CLIENT	= "client";
		const MESSAGE	= "message";

		public function __construct() {
			parent::__construct("sqlite:../data/atoms.sqlite");
		}
		
		/**
		 * Info about a game
		 */
		public function getGame($game) {
			$data = $this->query("SELECT * FROM ".self::GAME." WHERE id = ?", $game);
			return (count($data) ? $data[0] : null);
		}
		
		/**
		 * Register new game
		 */
		public function createGame($game, $players) {
			$this->insert(self::GAME, array("id"=>$game, "players"=>$players, "started"=>0));
		}
		
		/**
		 * Remove game, clients and their messages
		 */
		public function deleteGame($game) {
			$this->delete(self::GAME, $game);
			$clients = $this->getClientsForGame($game);
			for ($i=0;$i<count($clients);$i++) {
				$c = $clients[$i]["id"];
				$this->delete(self::CLIENT, $c);
				$this->delete(self::MESSAGE, array("client"=>$c));
			}
		}
		
		public function startGame($game) {
			$this->update(self::GAME, $game, array("started"=>1));
		}

		/**
		 * Add a client to registry for a given game
		 */
		public function registerClient($client, $game, $name) {
			$this->insert(self::CLIENT, array("game"=>$game, "id"=>$client, "name"=>$name));
		}
		
		/**
		 * List all clients in a game
		 */
		public function getClientsForGame($game) {
			return $this->query("SELECT * FROM ".self::CLIENT." WHERE game = ?", $game);
		}
		
		/** 
		 * Get client's game
		 */
		public function getGameForClient($client) {
			$data = $this->query("SELECT game FROM ".self::CLIENT." WHERE id = ?", $client);
			return (count($data) ? $data[0]["game"] : null);
		}
		
		/** 
		 * Insert message for a client
		 */
		public function insertMessage($client, $message) {
			$ts = microtime(true);
			$data = array("client"=>$client, "message"=>$message, "ts"=>$ts);
			$this->insert(self::MESSAGE, $data);
		}
		
		public function error($client, $message) {
			$this->insertMessage($client, '{"type":"error", "message":"'.$message.'"}');
		}
		
		/**
		 * Retrieve first message from a queue
		 */
		public function getMessage($client) {
			$data = $this->query("SELECT ts, message FROM ".self::MESSAGE." WHERE client = ? ORDER BY ts ASC LIMIT 1", $client);
			if (!count($data)) { return null; }
			$ts = $data[0]["ts"];
			$this->delete(self::MESSAGE, array("ts"=>$ts));
			return $data[0]["message"];
		}

	}
?>
