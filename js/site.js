  
  function provincesMapShow(){
            $('#map2').hide();           
            $('#map').show();
            map2_chart.filterAll();
            dc.redrawAll();
        }
        
        function municipalitiesMapShow(){
            $('#map').hide();
            $('#map2').show();
        }
		
        $('#dashboard').hide();
        $('#map').hide();
		var map_chart = dc.geoChoroplethChart("#map");
        var sector_chart_mun = dc.rowChart("#sectors_mun");
		var service_chart = dc.rowChart("#services");
        //var sector_chart_prov = dc.rowChart("#sectors_prov");
        var map2_chart = dc.geoChoroplethChart("#map2");
		var dataTable = dc.dataTable("#dc-table-graph");
        
        d3.csv("data/3W_Data.csv", function(csv_data){
            var cf = crossfilter(csv_data);
            
			cf.id = cf.dimension(function(d) {return d.ID; });
            cf.sector = cf.dimension(function(d) { return d.Sector; });
            cf.service = cf.dimension(function(d) { return d.Service; });
            cf.pcode = cf.dimension(function(d) { return d.Province_CODE; });
            cf.organisation = cf.dimension(function(d) { return d.Organisation; });
            cf.mcode = cf.dimension(function(d) { return d.Municipality_CODE; });
 
			//Set up a function to make Count Distinct groups
			// var reduceAddCountDistinct = function(metric) {
				// return function(p,v) {
					// if( p.varToCount.indexOf(v[metric]) == -1 ) {
						// p.varToCount.push(v[metric]);
						// p.varCount += 1;
					// }
					// return p;
				// };
			// };
			// var reduceRemoveCountDistinct = function() {
				// return function(p,v) {
					// if( p.varToCount.indexOf(v.varToCount) != -1 ) {
						// p.varToCount.splice(p.varToCount.indexOf(v.varToCount), 1);
						// p.varCount -= 1;
					// }
					// return p;
				// };
			// };
			// var reduceInitialCountDistinct = function() {
					// return { varToCount:[], varCount:0 }
			// }; 
			 
            var sector_mun = cf.sector.group();
            var service = cf.service.group();//.reduceSum(function(d) {return d.Beneficiaries;});
            var pcode = cf.pcode.group();
            var organisation = cf.organisation.group();
            var all = cf.groupAll();
            var mcode = cf.mcode.group();
			
			//var pcode = cf.pcode.group().reduce(reduceAddCountDistinct('Sector'),reduceRemoveCountDistinct,reduceInitialCountDistinct);
			//var sector_prov = cf.sector.group().reduce(reduceAddCountDistinct('Province_code'),reduceRemoveCountDistinct,reduceInitialCountDistinct);

			sector_chart_mun.width(320).height(300)
                .dimension(cf.sector)
                .group(sector_mun)
                .elasticX(true)
                .data(function(group) {
                    return group.top(6);
                })
                .colors(['#BF002D'])
                .colorDomain([0,0])
                .colorAccessor(function(d, i){return 1;})    
				;
				
 			service_chart.width(320).height(300)
                .dimension(cf.service)
                .group(service)
                .elasticX(true)
                .data(function(group) {
                    return group.top(10).filter( function (d) { return d.value !== 0; } );
                })
                .colors(['#BF002D'])
                .colorDomain([0,0])
                .colorAccessor(function(d, i){return 1;})  
				//.xAxis().ticks(5)
				;
			
			// Table of earthquake data
			  dataTable.width(960).height(800)
				.dimension(cf.mcode)
				.group(function(d) { return ""; })
				.size(200)
				.columns([
				  function(d) { return d.Organisation; },
				  function(d) { return d.Sector; },
				  function(d) { return d.Subsector; },
				  function(d) { return d.Service; },
				  function(d) { return pcode2prov[d.Province_CODE]; },
				  function(d) { return mcode2mun[d.Municipality_CODE]; },
				  function(d) { return d.Status; },
				  function(d) { return d.Beneficiaries; },
				  function(d) { return d.Beneficiary_type; }
				])
				.order(d3.ascending)
				.sortBy(function (d) {
						   return [d.Sector,d.Subsector,d.Service,pcode2prov[d.Province_CODE],mcode2mun[d.Municipality_CODE]].join();
				})
				;
				
			
            dc.dataCount("#count-info")
		.dimension(cf)
		.group(all);
                            
            d3.json("data/Phil_provinces.geojson", function (provincesJSON) {
                
                map_chart.width(660).height(800)
                    .dimension(cf.pcode)
                    .group(pcode)
					// .colors(['#cccccc','#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D'])
					// .colorDomain([0,1,2,3,4,5,6])
					// .colorAccessor(function(d) { if (d>0) {return d;} else {return 0;};})
					.colors(d3.scale.quantile()
									.domain([1,50])
									.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
					.colorCalculator(function (d) { return d ? map_chart.colors()(d) : '#cccccc'; })
					//.valueAccessor(function(d) {return d.value.varCount;})
                    .overlayGeoJson(provincesJSON.features, "Province", function (d) {
                        return d.properties.P_Str;
                    })
                    .projection(d3.geo.mercator().center([123,17.5]).scale(8000))
                    .title(function (d) {
                        return "Province: " + pcode2prov[d.key] + " - " + d.value + ' activities';
                    });
                    
                    d3.json("data/Phil_municipalities.geojson", function (municJSON){
                        map2_chart.width(660).height(800)
                            .dimension(cf.mcode)
                            .group(mcode)
							// .colors(['#cccccc','#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D'])
							// .colorDomain([0,1,2,3,4,5,6])
							// .colorAccessor(function(d) { if (d>0) {return d;} else {return 0;};})
							.colors(d3.scale.quantile()
											.domain([1,12])
											.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
							.colorCalculator(function (d) { return d ? map2_chart.colors()(d) : '#cccccc'; })
                            .overlayGeoJson(municJSON.features, "Municipalities", function (d) {
                                return d.properties.MUN_P_STR;
                            })
                            .projection(d3.geo.mercator().center([123,17.5]).scale(8000))
                            .title(function (d) {
                                return "Municipality: " + mcode2mun[d.key] + " - " + d.value + ' activities';
                            });
					
					$('#loading').hide();
                    $('#dashboard').show();
                    dc.renderAll();
                            
                    });                    
                });            
        });