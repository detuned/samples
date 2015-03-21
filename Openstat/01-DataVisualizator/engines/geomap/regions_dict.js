var
	RegionsDict = (function(){
		var
			REGIONS = {
				"RU-MOW"		 : "5",
				"RU-MOS"		 : "7", // Virtual region for MO
				
				
				"RU-LEN"		 : "70",
				"RU-SPE"		 : "371", // Virtual region for SPB
				
				"RU-KLU"		 : "71",
				"RU-KDA"		 : "72",
				"RU-YAR"		 : "73",
				"RU-AMU"		 : "74",
				"RU-KHA"		 : "75",
				"RU-PRI"		 : "76",
				"RU-YEV"		 : "77",
				"RU-CHU"		 : "78",
				"RU-SA"		 	 : "79",
				"RU-SAK"		 : "80",
				"RU-MAG"		 : "81",
				"RU-BEL"		 : "82",
				"RU-VOR"		 : "83",
				"RU-KRS"		 : "84",
				"RU-LIP"		 : "85",
				"RU-TAM"		 : "86",
				"RU-TA"		 	 : "87",
				"RU-KYA"		 : "88",
				"RU-KOS"		 : "90",
				"RU-KEM"		 : "91",
				"RU-KK"			 : "92",
				"RU-CHE"		 : "93",
				"RU-VLA"		 : "94",
				"RU-IVA"		 : "95",
				"RU-NVS"		 : "96",
				"RU-RYA"		 : "97",
				"RU-TVE"		 : "98",
				"RU-TOM"		 : "99",
				"RU-TUL"		 : "100",
				"RU-BU"			 : "102",
				"RU-ZAB"		 : "103",
				"RU-OMS"		 : "104",
				"RU-KAM"		 : "106",
				"RU-TYU"		 : "107",
				"RU-ORE"		 : "108",
				"RU-KO"		 	 : "109",
				"RU-KL"		 	 : "111",
				"RU-YAN"		 : "112",
				"RU-TY"			 : "113",
				"RU-SE"		 	 : "114",
				"RU-MUR"		 : "115",
				"RU-SVE"		 : "116",
				"RU-KHM"		 : "117",
				"RU-CU"		 	 : "118",
				"RU-SAR"		 : "119",
				"RU-PER"		 : "120",
				"RU-SAM"		 : "121",
				"RU-IRK"		 : "122",
				"RU-KR"			 : "123",
				"RU-NEN"		 : "124",
				"RU-CE"			 : "125",
				"RU-MO"			 : "126",
				"RU-STA"		 : "127",
				"RU-KIR"		 : "128",
				"RU-DA"			 : "129",
				"RU-ARK"		 : "130",
				"RU-NIZ"		 : "131",
				"RU-BA"			 : "132",
				"RU-AST"		 : "133",
				"RU-VLG"		 : "136",
				"RU-KGD"		 : "139",
				"RU-ALT"		 : "140",
				"RU-ROS"		 : "141",
				"RU-PNZ"		 : "142",
				"RU-AD"			 : "143",
				"RU-ORL"		 : "144",
				"RU-UD"			 : "145",
				"RU-VGG"		 : "146",
				"RU-NGR"		 : "147",
				"RU-KGN"		 : "148",
				"RU-SMO"		 : "149",
				"RU-PSK"		 : "150",
				"RU-ULY"		 : "151",
				"RU-ME"			 : "152",
				"RU-BRY"		 : "153",
				"RU-KB"			 : "155",
				"RU-KC"			 : "156",
				"RU-IN"			 : "205",
				"RU-AL"			 : "206"
				},
			/** 
			 * Public of RegionsDict
			 */
			obj = {
				getRegionCode : function( code ){
					if (!code) {
						return NaN;
						}
					code = trimStr( code , ' \\s\\t' ).split( "\t" ).pop();
					if (!isNaN (+ code)) {
						return + code;
						}
					if (! (code in REGIONS)) {
						return NaN;
						}
					return REGIONS[code];
					}
				}
		return obj;
		})();