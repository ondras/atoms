<?php
	error_reporting(E_ALL);
	include("db.php");
		
	$db = new AtomsDB();
	$client = "";
	if (isset($_POST["client"])) { $client = $_POST["client"]; }
	
	if (isset($_POST["type"])) { /* process POST data */
		$type = $_POST["type"];
		switch ($type) {
			case "setup":
				$game = $_POST["game"];
				$players = $_POST["players"];
				$name = $_POST["name"];
					
				$gameinfo = $db->getGame($game);
				
				if ($gameinfo && $gameinfo["started"] == 1) { 
					$db->error($client, "Game alredy started"); 
					die();
				}

				/* exists with a different player count */
				if ($gameinfo && $gameinfo["players"] != $players) { 
					$db->error($client, "Game alredy created with ".$gameinfo["players"]." players"); 
					die();
				}
				
				/* does not exist */
				if (!$gameinfo) { $db->createGame($game, $players); }
				
				/* add client to game */
				$db->registerClient($client, $game, $name);
				
				$clients = $db->getClientsForGame($game);
				if (count($clients) == $players) { /* start game! */
					$db->startGame($game);
					$names = array();
					for ($i=0;$i<count($clients);$i++) { $names[] = '"' . $clients[$i]["name"] . '"'; }
					$names = implode(",", $names);
					
					for ($i=0;$i<count($clients);$i++) { /* create messages for clients */
						$msg = '{"type":"create", "names":['.$names.'], "index":'.$i.'}';
						$db->insertMessage($clients[$i]["id"], $msg);
					}
				}
				
			break;
			
			case "round":
				$x = $_POST["x"];
				$y = $_POST["y"];
				$game = $db->getGameForClient($client);
				if (!$game) { 
					$db->error($client, "Not joined in any game"); 
					die();
				}

				$clients = $db->getClientsForGame($game);
				$msg = '{"type":"round", "x":'.$x.', "y":'.$y.'}';
				for ($i=0;$i<count($clients);$i++) {
					$c = $clients[$i]["id"];
					if ($c == $client) { continue; }
					$db->insertMessage($c, $msg);
				}
			break;
			
			case "close":
				$game = $db->getGameForClient($client);
				if ($game) { $db->deleteGame($game); }
			break;
			
			default:
				$db->error($client, "Unknown message type ".$type);
				die();
			break;
		}
	} else {
	
		/* wait for a message */
		while (1) {
			$message = $db->getMessage($client);
			if ($message) {
				echo $message;
				break;
			} else {
				sleep(1);
			}
		}
		
	}
?>
