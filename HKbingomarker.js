// ==UserScript==
// @name         HK Bingo Highlighter
// @namespace    http://tophatluke.com/
// @version      0.1
// @description  Bingo square highlighter for Hollow Knight boards on BingoSync
// @author       TopHatLuke
// @match        https://bingosync.com/room/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // avoiding use of https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
    var selectedColor = document.querySelector('div.color-chooser.chosen-color').getAttribute('squarecolor');
    var bingoSquares = {};
    var bingoSquareKeys = [];
    var bingoVerifiers = {};
    var HK = {};
    var HKdata = {};
    var heartbeat = {};

    var _HK_ = function() {
        var playerData = function() {
            var lastCommand;
            var ws;
            var data;

            var connect = function() {
                console.log("Connecting to Hollow Knight PlayerData");
                try {
                    var url = "localhost";
                    ws = new WebSocket("ws://" + url + ":11420/playerData");
                    ws.onerror = function(error) {
                        console.log(error);
                    };
                    ws.onopen = function() {
                        getPlayerData();
                    };
                    ws.onmessage = function(evt) {
                        var received_msg = evt.data;
                        if (received_msg == "undefined") {
                            updatePlayerData({});
                            return;
                        }
                        var json = JSON.parse(received_msg);
                        updatePlayerData(json);
                    };
                    ws.onclose = function() {
                        setTimeout(function(){connect()}, 5000);
                    };
                }
                catch(e) {
                    console.log(e);
                }
            };

            var send = function(command) {
                lastCommand = command;
                ws.send(command);
            };

            var getPlayerData = function() {
                console.log("Refreshing Hollow Knight data");
                send("json");
            };

            var updatePlayerData = function(minData) {
                    if (minData != undefined && 'var' in minData) {
                        if (minData.var == 'SaveLoaded' || minData.var == 'NewSave') {
                            ws.send('json');
                            return;
                        }
                        else {
                            var name = minData.var;
                            var value;

                            switch (minData.value) {
                                case 'True':
                                case true:
                                case 'true':
                                    value = true;
                                    break;
                                case 'False':
                                case false:
                                case 'false':
                                    value = false;
                                    break;
                                default:
                                    value = minData.value;
                                    break;
                            }
                            data[name] = value;
                        }
                    }
                    else {
                        if (minData != undefined) {
                            data = minData;
                        }
                    }

                    if (data == undefined) {
                        data = {};
                        return;
                    }
            };

            return {
                init: connect,
                refresh: function(){updatePlayerData(data); HKdata = data;},
                data: data
            };
        };

        var getBingoVerifiers = function(currentSquares) {
            var comparisons = {
                'lt': function(lval, rval) {return (lval <  rval); },
                'le': function(lval, rval) {return (lval <= rval); },
                'ne': function(lval, rval) {return (lval != rval); },
                'eq': function(lval, rval) {return (lval == rval); },
                'gt': function(lval, rval) {return (lval >  rval); },
                'ge': function(lval, rval) {return (lval >= rval); }
            };
            var compare = function(data, key, comparison, rval) {
                if (data == undefined) {return false;}
                if (key in data) {
                    return comparisons[comparison](data[key], rval);
                }
                return false;
            };
            var has = function(data, key) {
                if (data == undefined) {return false;}
                if (key in data) {
                    return data[key];
                }
                return false;
            };
            var bingoSquares = {
                "Failed Champion": {
                    "isMet": function(data) {
                        var key = "falseKnightDreamDefeated";
                        return has(data, key);
                    }
                },
                "False Knight + Brooding Mawlek": {
                    "isMet": function(data) {
                        var goal = 2;
                        var keys = ['falseKnightDefeated', 'mawlekDefeated'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Soul Master": {
                    "isMet": function(data) {
                        var key = "mageLordDefeated";
                        return has(data, key);
                    }
                },
                "Soul Tyrant": {
                    "isMet": function(data) {
                        var key = "mageLordDreamDefeated";
                        return has(data, key);
                    }
                },
                "Hornet 2": {
                    "isMet": function(data) {
                        var key = "hornetOutskirtsDefeated";
                        return has(data, key);
                    }
                },
                "Crystal Guardian 1": {
                    "isMet": function(data) {
                        var key = "defeatedMegaBeamMiner";
                        return has(data, key);
                    }
                },
                "Crystal Guardian 2": {
                    "isMet": function(data) {
                        var key = "defeatedMegaBeamMiner2";
                        return has(data, key);
                    }
                },
                "Dung Defender": {
                    "isMet": function(data) {
                        var key = "defeatedDungDefender";
                        return has(data, key);
                    }
                },
                "Flukemarm": {
                    "isMet": function(data) {
                        var key = "flukeMotherDefeated";
                        return has(data, key);
                    }
                },
                "Nosk": {
                    "isMet": function(data) {
                        // No idea if this is correct
                        var key = "killedMimicSpider";
                        return has(data, key);
                    }
                },
                "Mantis Lords": {
                    "isMet": function(data) {
                        var key = "defeatedMantisLords";
                        return has(data, key);
                    }
                },
                "Collector": {
                    "isMet": function(data) {
                        var key = "collectorDefeated";
                        return has(data, key);
                    }
                },
                "Pick up the Love Key": {
                    "isMet": function(data) {
                        var goal = 1;
                        var keys = ['hasLoveKey', 'openedLoveDoor'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Traitor Lord": {
                    "isMet": function(data) {
                        var key = "killedTraitorLord";
                        return has(data, key);
                    }
                },
                "Uumuu": {
                    "isMet": function(data) {
                        var key = "defeatedMegaJelly";
                        return has(data, key);
                    }
                },
                "Watcher Knights": {
                    "isMet": function(data) {
                        // Not sure if this is correct
                        var key = "duskKnightDefeated";
                        return has(data, key);
                    }
                },
                "Lurien": {
                    "isMet": function(data) {
                        var key = "lurienDefeated";
                        return has(data, key);
                    }
                },
                "Monomon": {
                    "isMet": function(data) {
                        var key = "monomonDefeated";
                        return has(data, key);
                    }
                },
                "Herrah": {
                    "isMet": function(data) {
                        var key = "hegemolDefeated";
                        return has(data, key);
                    }
                },
                "Vengefly King + Massive Moss Charger": {
                    "isMet": function(data) {
                        var goal = 2
                        var keys = ['giantFlyDefeated', 'megaMossChargerDefeated']
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Xero": {
                    "isMet": function(data) {
                        var key = "xeroDefeated";
                        return has(data, key);
                    }
                },
                "Gorb": {
                    "isMet": function(data) {
                        // Not sure if this is correct
                        var key = "aladarSlugDefeated";
                        return has(data, key);
                    }
                },
                "Elder Hu": {
                    "isMet": function(data) {
                        var key = "elderHuDefeated";
                        return has(data, key);
                    }
                },
                "Galien": {
                    "isMet": function(data) {
                        var key = "galienDefeated";
                        return has(data, key);
                    }
                },
                "Markoth": {
                    "isMet": function(data) {
                        var key = "markothDefeated";
                        return has(data, key);
                    }
                },
                "Marmu": {
                    "isMet": function(data) {
                        var key = "killedGhostMarmu";
                        return has(data, key);
                    }
                },
                "No Eyes": {
                    "isMet": function(data) {
                        var key = "noEyesDefeated";
                        return has(data, key);
                    }
                },
                "Upgrade Grimmchild once": {
                    "isMet": function(data) {
                        // Not sure if goal is supposed to be 1 or 2
                        var goal = 2;
                        var key = "grimmChildLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Broken Vessel": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var key = "killedInfectedKnight";
                        return has(data, key);
                    }
                },
                "Lost Kin": {
                    "isMet": function(data) {
                        var key = "infectedKnightDreamDefeated";
                        return has(data, key);
                    }
                },
                "Shade Soul": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "fireballLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Abyss Shriek": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "screamLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Howling Wraiths": {
                    "isMet": function(data) {
                        var goal = 1;
                        var key = "screamLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Desolate Dive": {
                    "isMet": function(data) {
                        var goal = 1;
                        var key = "quakeLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Nail 2": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "nailSmithUpgrades";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Nail 3": {
                    "isMet": function(data) {
                        var goal = 3;
                        var key = "nailSmithUpgrades";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Dream Nail": {
                    "isMet": function(data) {
                        var key = "hasDreamNail";
                        return has(data, key);
                    }
                },
                "Dream Gate": {
                    "isMet": function(data) {
                        var key = "hasDreamGate";
                        return has(data, key);
                    }
                },
                "Have 2 Pale Ore": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "ore";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Cyclone Slash": {
                    "isMet": function(data) {
                        var key = "hasCyclone";
                        return has(data, key);
                    }
                },
                "Great Slash": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var key = "hasUpwardSlash";
                        return has(data, key);
                    }
                },
                "Dash Slash": {
                    "isMet": function(data) {
                        var key = "hasDashSlash";
                        return has(data, key);
                    }
                },
                "Monarch Wings": {
                    "isMet": function(data) {
                        var key = "hasDoubleJump";
                        return has(data, key);
                    }
                },
                "Crystal Heart": {
                    "isMet": function(data) {
                        var key = "hasSuperDash";
                        return has(data, key);
                    }
                },
                "Shade Cloak": {
                    "isMet": function(data) {
                        var key = "hasShadowDash";
                        return has(data, key);
                    }
                },
                "Isma's Tear": {
                    "isMet": function(data) {
                        var key = "hasAcidArmour";
                        return has(data, key);
                    }
                },
                "Tram Pass + Visit all 5 Tram Stations": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Lumafly Lantern": {
                    "isMet": function(data) {
                        var key = "hasLantern";
                        return has(data, key);
                    }
                },
                "All Grubs: Xroads (5) + Fog Canyon (1)": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save the 5 grubs in CoT": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "All Grubs: Greenpath (4) + Fungal (2)": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save the 7 grubs in Crystal Peaks": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save the 3 grubs in Waterways": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save the 3 grubs in Queen's Garden": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save the 5 grubs in Deepnest": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Save 15 grubs": {
                    "isMet": function(data) {
                        var goal = 15;
                        var key = "grubsCollected";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Save 20 grubs": {
                    "isMet": function(data) {
                        var goal = 20;
                        var key = "grubsCollected";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Obtain fountain vessel fragment": {
                    "isMet": function(data) {
                        // fountainGeo ???
                        // fountainVesselSummoned ???
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Obtain 3 extra notches": {
                    "isMet": function(data) {
                        var goal = 3;
                        var keys = ['gotGrimmNotch','notchFogCanyon','notchShroomOgres'
                                   // ,'salubraNotch1','salubraNotch2','salubraNotch3','salubraNotch4'
                                   // ,'slyNotch1','slyNotch2'
                                   ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Obtain 1 extra soul vessel": {
                    "isMet": function(data) {
                        var goal = 3;
                        var key = "vesselFragmentCollected";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Obtain 1 extra mask": {
                    "isMet": function(data) {
                        var goal = 6;
                        var key = "maxHealthBase";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Obtain 2 extra masks": {
                    "isMet": function(data) {
                        var goal = 7;
                        var key = "maxHealthBase";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Have 5 Wanderer's Journals": {
                    "isMet": function(data) {
                        var goal = 5;
                        var key = "trinket1";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Have 5 Hallownest Seals": {
                    "isMet": function(data) {
                        var goal = 5;
                        var key = "trinket2";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Collect 3 King's Idols": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "trinket3";
                        var spent = has(data, "soldTrinket3");
                        if (spent === false) {
                            spent = 0;
                        }
                        return compare(data, key, "ge", goal - spent);
                    }
                },
                "Collect 1 Arcane Egg": {
                    "isMet": function(data) {
                        var goal = 1;
                        var key = "trinket4";
                        var spent = has(data, "soldTrinket4");
                        if (spent === false) {
                            spent = 0;
                        }
                        return compare(data, key, "ge", goal - spent);
                    }
                },
                "Give Flower to Elderbug": {
                    "isMet": function(data) {
                        var key = "elderbugGaveFlower";
                        return has(data, key);
                    }
                },
                "Defeat Colosseum Zote": {
                    "isMet": function(data) {
                        // Not sure if correct
                        //var goal = 0;
                        var key = "zoteDefeated";
                        return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Colosseum 1": {
                    "isMet": function(data) {
                        var key = "colosseumBronzeCompleted";
                        return has(data, key);
                    }
                },
                "Rescue Bretta + Sly": {
                    "isMet": function(data) {
                        var goal = 2;
                        var keys = ['brettaRescued', 'slyRescued'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Use 2 Simple Keys": {
                    "isMet": function(data) {
                        // Not sure how to implement right now
                        // simpleKeys
                        // slySimpleKey
                        // gotLurkerKey
                        // hasMenderKey
                        // hasSlykey
                        // hasSpaKey
                        // hasWaterwaysKey
                        // city2_sewerDoor
                        //
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Rescue Zote in Deepnest": {
                    "isMet": function(data) {
                        var key = "zoteRescuedDeepnest";
                        return has(data, key);
                    }
                },
                "Use City Crest + Ride both CoT large elevators": {
                    "isMet": function(data) {
                        // hasCityKey
                        var goal = 3;
                        var keys = ['openedCityGate', 'cityLift1', 'cityLift2'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Talk to Lemm with Crest Equipped": {
                    "isMet": function(data) {
                        // Not sure
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Have 1500 geo in the bank": {
                    "isMet": function(data) {
                        var goal = 1500;
                        var key = "bankerBalance";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Break the 420 geo rock in Kingdom's Edge": {
                    "isMet": function(data) {
                        // Not sure
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Unlock Hidden Stag Station": {
                    "isMet": function(data) {
                        var key = "openedHiddenStation";
                        return has(data, key);
                    }
                },
                "Unlock Queen's Garden Stag": {
                    "isMet": function(data) {
                        var key = "openedGardensStagStation";
                        return has(data, key);
                    }
                },
                "Unlock Deepnest Stag": {
                    "isMet": function(data) {
                        var key = "openedDeepnest";
                        return has(data, key);
                    }
                },
                "Buy 6 map pins from Iselda (All but two)": {
                    "isMet": function(data) {
                        var goal = 6;
                        var keys = [//'hasMarker','hasMarker_b','hasMarker_r','hasMarker_w','hasMarker_y',
                                    //'hasPinBlackEgg','hasPinGuardian',
                                    'hasPin',
                                    'hasPinBench',
                                    'hasPinCocoon','hasPinDreamPlant','hasPinGhost',
                                    'hasPinShop','hasPinSpa','hasPinStag','hasPinTram'
                        ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Buy 8 map pins from Iselda (All)": {
                    "isMet": function(data) {
                        var goal = 8;
                        var keys = [//'hasMarker','hasMarker_b','hasMarker_r','hasMarker_w','hasMarker_y',
                                    //'hasPinBlackEgg','hasPinGuardian',
                                    'hasPin',
                                    'hasPinBench',
                                    'hasPinCocoon','hasPinDreamPlant','hasPinGhost',
                                    'hasPinShop','hasPinSpa','hasPinStag','hasPinTram'
                        ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Unlock Queen's Stag + King's Stag Stations": {
                    "isMet": function(data) {
                        // queenStationNonDisplay
                        // kingsStationNonDisplay
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Talk to Hornet at CoT Statue + Herrah": {
                    "isMet": function(data) {
                        var goal = 2;
                        var keys = ['hornetFountainEncounter', 'hornetDenEncounter'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Watch Cloth Die": {
                    "isMet": function(data) {
                        var key = "clothKilled";
                        return has(data, key);
                    }
                },
                "Kill Myla": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var key = "miner";
                        return has(data, key);
                    }
                },
                "Spend 3000 geo": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Spend 4000 geo": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Spend 5000 geo": {
                    "isMet": function(data) {
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Pay for 6 tolls": {
                    "isMet": function(data) {
                        var goal = 6;
                        var keys = ['tollBenchCity','tollBenchQueensGardens','tollBenchAbyss',
                                    'openedCrossroads',
                                    'openedGreenPath',
                                    'openedRuins1',
                                    'openedRuins2',
                                    'openedFungalWastes',
                                    'openedRoyalGardens',
					//'openedRestingGrounds',
					//'openedDeepnest',
					//'openedStagNest',
                                    'openedHiddenStation',
					//'openedPalaceGrounds',
					//'openedTramLower',
					//'openedTramRestingGrounds',
                                    'mineLiftOpened',
					//'openedRestingGrounds02',
                    //'abyssGateOpened',
                                    'openedGardensStagStation'
                        ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Longnail + MoP": {
                    // gotCharm_18 = Longnail
                    // gotCharm_13 = MoP
                    "isMet": function(data) {
                        var goal = 2;
                        var keys = ['gotCharm_18', 'gotCharm_13'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Fragile Heart, Greed, and Strength": {
                    "isMet": function(data) {
                        // gotCharm_23 = Heart
                        // gotCharm_24 = Greed
                        // gotCharm_25 = Strength
                        var goal = 3;
                        var keys = ['gotCharm_23', 'gotCharm_24', 'gotCharm_25'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Sprintmaster + Dashmaster": {
                    "isMet": function(data) {
                        // gotCharm_37 = Sprintmaster
                        // gotCharm_31 = Dashmaster
                        var goal = 2;
                        var keys = ['gotCharm_37', 'gotCharm_31'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Deep Focus + Quick Focus": {
                    "isMet": function(data) {
                        // gotCharm_34 = Deep Focus
                        // gotCharm_7 = Quick Focus
                        var goal = 2;
                        var keys = ['gotCharm_34', 'gotCharm_7'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Spell Twister + Shaman Stone": {
                    "isMet": function(data) {
                        // gotCharm_33 = Spell Twister
                        // gotCharm_19 = Shaman Stone
                        var goal = 2;
                        var keys = ['gotCharm_33', 'gotCharm_19'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Lifeblood Heart + Joni's Blessing": {
                    "isMet": function(data) {
                        // gotCharm_8 = Lifeblood Heart
                        // gotCharm_27 = Joni's Blessing
                        var goal = 2;
                        var keys = ['gotCharm_8', 'gotCharm_27'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Weaversong": {
                    "isMet": function(data) {
                        // gotCharm_39 = Weaversong
                        var key = "gotCharm_39";
                        return has(data, key);
                    }
                },
                "Grubsong": {
                    "isMet": function(data) {
                        // gotCharm_3 = Grubsong
                        var key = "gotCharm_3";
                        return has(data, key);
                    }
                },
                "Sharp Shadow": {
                    "isMet": function(data) {
                        // gotCharm_16 = Sharp Shadow
                        var key = "gotCharm_16";
                        return has(data, key);
                    }
                },
                "Shape of Unn": {
                    "isMet": function(data) {
                        // gotCharm_28 = Shape of Unn
                        var key = "gotCharm_28";
                        return has(data, key);
                    }
                },
                "Thorns of agony + Baldur Shell + Spore Shroom": {
                    "isMet": function(data) {
                        // gotCharm_12 = Thorns of Agony
                        // gotCharm_5 = Baldur Shell
                        // gotCharm_17 = Spore Shroom
                        var goal = 3;
                        var keys = ['gotCharm_12', 'gotCharm_5', 'gotCharm_17'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Quick Slash": {
                    "isMet": function(data) {
                        // gotCharm_32 = Quick Slash
                        var key = "gotCharm_32";
                        return has(data, key);
                    }
                },
                "Heavy Blow + Steady Body": {
                    "isMet": function(data) {
                        // gotCharm_15 = Heavy Blow
                        // gotCharm_14 = Steady Body
                        var goal = 2;
                        var keys = ['gotCharm_15', 'gotCharm_14'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Talk to Mask Maker": {
                    "isMet": function(data) {
                        var key = "maskmakerMet";
                        return has(data, key);
                    }
                },
                "Talk to Midwife": {
                    "isMet": function(data) {
                        var key = "midwifeMet";
                        return has(data, key);
                    }
                },
                "Have 4 Rancid Eggs": {
                    "isMet": function(data) {
                        var goal = 4;
                        var key = "rancidEggs";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Kill your shade in Jiji's Hut": {
                    "isMet": function(data) {
                        var key = "jijiShadeOffered";
                        return has(data, key);
                    }
                },
                "Collect 500 essence": {
                    "isMet": function(data) {
                        var goal = 500;
                        var key = "dreamOrbs";
                        var spent = has(data, "dreamOrbsSpent");
                        if (spent === false) {
                            spent = 0;
                        }
                        return compare(data, key, "ge", goal - spent);
                    }
                },
                "Dream Wielder": {
                    "isMet": function(data) {
                        // gotCharm_30 = Dream Wielder
                        var key = "gotCharm_30";
                        return has(data, key);
                    }
                },
                "Interact with 5 Cornifer locations": {
                    "isMet": function(data) {
                        // This is likely not the proper way to do this goal
                        var goal = 5;
                        var keys = ['corn_abyssEncountered','corn_cityEncountered','corn_cliffsEncountered','corn_crossroadsEncountered',
                                    'corn_deepnestEncountered','corn_deepnestMet1','corn_deepnestMet2','corn_fogCanyonEncountered',
                                    'corn_fungalWastesEncountered','corn_greenpathEncountered','corn_minesEncountered',
                                    'corn_outskirtsEncountered','corn_royalGardensEncountered','corn_waterwaysEncountered'
                        ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Flukenest": {
                    "isMet": function(data) {
                        // gotCharm_11 = Flukenest
                        var key = "gotCharm_11";
                        return has(data, key);
                    }
                },
                "Stag Nest vessel fragment": {
                    "isMet": function(data) {
                        var key = "vesselFragStagNest";
                        return has(data, key);
                    }
                },
                "Complete 4 full dream trees": {
                    "isMet": function(data) {
                        // Not sure if correct
                        // scenesEncounteredDreamPlantC
                        var goal = 4;
                        var key = "scenesEncounteredDreamPlantC";
                        var count = has(data, key).length;
                        return goal>=count
                    }
                },
                "Kill 2 Soul Warriors": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var goal = 2;
                        var key = "killedMageKnight";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Buy 6 maps": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var goal = 6;
                        var keys = [//'mapAllRooms', //???
                                    'mapAbyss','mapCity','mapCliffs','mapCrossroads','mapDeepnest','mapDirtmouth',
                                    'mapFogCanyon','mapFungalWastes','mapGreenpath','mapMines','mapOutskirts',
                                    'mapRestingGrounds','mapRoyalGardens','mapWaterways'
                        ];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Talk to Emilitia (shortcut out of sewers)": {
                    "isMet": function(data) {
                        var key = "metEmilitia";
                        return has(data, key);
                    }
                },
                "Descending Dark": {
                    "isMet": function(data) {
                        var goal = 2;
                        var key = "quakeLevel";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Glowing Womb + Grimmchild": {
                    "isMet": function(data) {
                        // gotCharm_22 = Glowing Womb
                        // gotCharm_40 = Grimmchild
                        var goal = 2;
                        var keys = ['gotCharm_22', 'gotCharm_40'];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Take a bath in all 4 Hot Springs": {
                    "isMet": function(data) {
                        // Not sure how to implement right now
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Hiveblood": {
                    "isMet": function(data) {
                        var key = "gotCharm_29";
                        return has(data, key);
                    }
                },
                "Hive Knight": {
                    "isMet": function(data) {
                        var key = "killedHiveKnight";
                        return has(data, key);
                    }
                },
                "Mask Shard in the Hive": {
                    "isMet": function(data) {
                        // Not sure what key to use or if available
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Parry Revek 3 times without dying (Glade of Hope Guard)": {
                    "isMet": function(data) {
                        // N/A implementation ?
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Void Tendrils Journal Entry": {
                    "isMet": function(data) {
                        var key = "killedAbyssTendril";
                        return has(data, key);
                    }
                },
                "Goam and Garpede Journal Entries": {
                    "isMet": function(data) {
                        // Not sure of keys to use... maybe killedBigCentipede/killedBlocker/killedWorm ??
                        var goal = 2;
                        var keys = [''];
                        var count = 0;
                        keys.forEach(function(key, y, z) {
                            if (key in data && data[key]) {
                                count += 1;
                            }
                        });
                        return (count >= goal);
                    }
                },
                "Kill 6 different Stalking Devouts": {
                    "isMet": function(data) {
                        // Not sure of key to use... maybe killsSlashSpider ??
                        //var goal = 0;
                        //var key = "";
                        //return has(data, key);
                        //return compare(data, key, "ge", goal);
                    }
                },
                "Kill 4 Mimics": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var goal = 4;
                        var key = "killsGrubMimic";
                        return compare(data, key, "ge", goal);
                    }
                },
                "Talk to Bardoon": {
                    "isMet": function(data) {
                        // Not sure if correct
                        var key = "bigCatMeet";
                        return has(data, key);
                    }
                },
                "Talk to the Fluke Hermit": {
                    "isMet": function(data) {
                        var key = "scaredFlukeHermitEncountered";
                        return has(data, key);
                    }
                },
                "Pale Lurker": {
                    "isMet": function(data) {
                        var key = "killedPaleLurker";
                        return has(data, key);
                    }
                }
            };

            return (function(){
                var currentVerifiers = {};
                currentSquares.forEach(function(square, y, z) {
                    if (square in bingoSquares) {
                        currentVerifiers[square] = bingoSquares[square];
                    }
                    else {
                        console.warn("Could not find a verifier for square: " + square);
                    }
                });
                return currentVerifiers;
            })();
        };

        return {
            getBingoVerifiers: getBingoVerifiers,
            playerData: playerData()
        };
    };

    // Add a CSS rule to the bingo board page
    // This logic is heavily based on the example at https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
    var addCSSrule = function() {
        var style = document.createElement('style');
        document.head.appendChild(style);
        var stylesheet = style.sheet;
        stylesheet.insertRule('td.square.HK-hilite {border: 5px '+ selectedColor +' solid !important;}', 0);
    };

    // Handle user-selected color for marking squares
    var setColorChangeHandler = function() {
        document.querySelectorAll('div.color-chooser').forEach( function(colorbutton,y,z){
        colorbutton.addEventListener('click', event => {
            selectedColor = document.querySelector('div.color-chooser.chosen-color').getAttribute('squarecolor');
            console.log('Color changed to: '+ selectedColor);
        });
        });
    };

    var HKPulse = function() {
        HK.playerData.refresh();
        var data = HKdata;
        //console.log(bingoVerifiers.keys());
        Object.keys(bingoSquares).forEach(function(squarename, y, z) {
            if (data == undefined) {
                return;
            }
            if (squarename in bingoVerifiers && bingoVerifiers[squarename].isMet(data)) {
                bingoSquares[squarename].classList.add('HK-hilite');
            }
            else {
                bingoSquares[squarename].classList.remove('HK-hilite');
            }
        });
    };

    // Identify squares on current bingo board
    var getBingoBoardInfo = function() {
        var _bingoSquares = document.querySelectorAll('td.square > div.text-container');
        _bingoSquares.forEach(function(square,y,z){
            var txt = square.textContent;
            bingoSquareKeys.push(txt);
            bingoSquares[txt] = square.parentNode;
        });
        bingoVerifiers = HK.getBingoVerifiers(bingoSquareKeys);
        heartbeat = setInterval(HKPulse, 2000);
    };

    // Wait for bingo board to be initialized, then start making sense of it
    var bingoready = setInterval(function() {
        if (document.querySelectorAll('body.__plain_text_READY__.vsc-initialized').length > 0) {
            clearInterval(bingoready);
            console.log('I think the bingo board is ready!');
            HK = _HK_();
            addCSSrule();
            setColorChangeHandler();
            getBingoBoardInfo();
            HK.playerData.init();
        }
    }, 100);

})();
