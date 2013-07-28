var player;


//var scoreId = 29514;
//var scoreSecret = "38b8d7f12e"

var scoreId = 82782;
var scoreSecret = "7cf5724682"

consumerKey = 'musichackday'
var events;
var eventsSorted;
var iteration=0;

//playlist();

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

var Jazz = document.getElementById("Jazz1"); if(!Jazz || !Jazz.isJazz) Jazz = document.getElementById("Jazz2");


function plugPiano() {
	console.log('plugPiano');
	try{
		 var list=Jazz.MidiOutList();
		 console.log(list);
        Jazz.MidiOutOpen(list[1]);
		 console.log("selected");
		}
		catch(err){ console.log('error:'+err);}
}

var maxPageWidth;
var pageWidth;

var timeoutId;

var mpager;

var mmToPixel = (827/210);

var isMobile;

var parts;


function startPlaying() {
    if(player!=undefined) player.stop();
	isMobile = (navigator.platform == 'iPad' || navigator.platform == 'iPhone' || navigator.platform == 'iPod');
    
	$('#smp-pages').width($(document).width() - 250);
	$('#smp-control').width($(document).width() - 250);
    
	maxPageWidth = $('#smp-pages').width();
	var mainUrl = $.url();
	tmpScoreId =mainUrl.param('score');
	tmpScoreSecret = mainUrl.param('secret');
	if (tmpScoreId && tmpScoreSecret) {
		scoreId = tmpScoreId;
		scoreSecret = tmpScoreSecret;
	}
	MIDI.loader = new widgets.Loader;
    
    runPlaylist();
}

function MIDIPlayerReady() {
	console.log('MIDI player ready');
	$('#smp-control-play').show();
	$('#smp-control-replay').show();
	$('#smp-tempo-list').show();
	if(parts > 1) {
		$('#smp-channel-list').show();
		$('#smp-channel-list').html('');
		for (var index = 0; index < parts; index++) {
		    $('#smp-channel-list').append($('<option>', { 
		        value: index,
		        selected: true,
		        text : "Channel" + (parseInt(index)+1) 
		    	}));
		}
		$('#smp-channel-list').change(function(){
			player.pause();
			$(this).find('option').each(function(index, value) {
	    		if(this.selected)
	    			MIDI.channels[index].mute = false;
	    		else
	    			MIDI.channels[index].mute = true;
	    	});
	    	player.resume();
	    });
    }
	player.setAnimation(function(data, element) {
		var now = data.now; // where we are now
		var end = data.end; // end of song
		var event = findEvent(events, (1000 * now) / player.timeWarp);
		mpager.goTo(event.elid);
	});
	player.addListener(function(data) { // set it to your own function!
		var now = data.now; // where we are now
		var end = data.end; // time when song ends
		var channel = data.channel; // channel note is playing on
		var message = data.message; // 128 is noteOff, 144 is noteOn
		var note = data.note; // the note
		var velocity = data.velocity; // the velocity of the note
		if(Jazz.isJazz) {
			var msg;
			if(message==128) msg=0x80;
			else msg=0x90;
			Jazz.MidiOut(msg,note,velocity/1.2);
		}
	});
    
    autoPlay();
}

function measureChange(element, id) {
	$("#smp-control-measure-goto").val(parseInt(id) + 1);
	smpInputResizer("#smp-control-measure-goto");
	$("#smp-control-page-goto").val(parseInt(mpager.elements[id].page)+1);
	smpInputResizer("#smp-control-page-goto");
}

function measureClick(element, id) {
	mpager.highlightMeasure(element, id);
	seekToMeasureId(id);
}

function seekToMeasureId(id) {
	if(player){
		var marker = eventsSorted[parseInt(id)];
		if(marker) {
			player.pause(true);
		    player.currentTime = marker * player.timeWarp;
		    player.resume();
		}
	}
}

function isScrolledIntoView(elem) {
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(window).height();

	var elemTop = $(elem).offset().top;
	var elemBottom = elemTop + $(elem).height();

	return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

function findEvent(evts, time) {
	var l = evts.length;
	if (l <= 1) {
		return evts[0];
	}
	var i = Math.floor(l / 2);
	var ev = evts[i];
	if (time < ev.position) {
		return findEvent(evts.slice(0, i), time);
	} else if (time > ev.position) {
		return findEvent(evts.slice(i), time);
	} else {
		return ev;
	}
}

function smpInputResizer(element) {
  $(element).css('width', $(element).val().length * 15);
}

function runPlaylist() {

                   $.getJSON('http://steinwayradio.herokuapp.com/playlist/pop', function(data) {
                             console.log(data);
                             if(data !=undefined) {
                             scoreId = data.id;
                             scoreSecret = data.secret;
                             processId();
                             }
                             else {
                                $("#smp-pages").html('Sorry, nothing to play');
                             
                             }
                             return;
                             });

                   
    /*if(iteration==0) {
        var data= '{"id":"39069","secret":"123f429e59","pageCount":"1","permalink":"http://musescore.com/score/39069","title":"Reunion"}';
        iteration++;
    }
    else
        var data= '{"id":"26467","secret":"c0496270b2","pageCount":"4","permalink":"http://musescore.com/score/26467","title":"Angry birds fuga con barok style"}';
    var dt= JSON.parse(data);
    console.log(dt);
    scoreId = dt.id;
    scoreSecret = dt.secret;
    console.log('scoreId = '+scoreId+' scoreSecret = '+scoreSecret);
    return(1);*/
}

function processId() {
    console.log('processing : ' +scoreId);
	$.getJSON('http://api.musescore.com/services/rest/score/' + scoreId + ".jsonp?secret=" + scoreSecret + "&oauth_consumer_key="+ consumerKey +"&callback=?", function(data) {
              var pages = data.metadata.pages;
              parts = data.metadata.parts.length;
              var dimensions = data.metadata.dimensions;
              var pageWidth = parseInt(dimensions.split('x')[0]) * mmToPixel;
              $("#smp-pages").html('');
              $("#smp-channel-list").html('');
              $("#smp-page-count").text(pages);
              $("#smp-measure-count").text(data.metadata.measures);
              mpager = $("#smp-pages").mpager({
                                              api		: true,
                                              pages 	: pages,
                                              scoreId : scoreId,
                                              scoreSecret : scoreSecret,
                                              apiServer : "http://musescore.com",
                                              staticBucket : "static.musescore.com",
                                              measureClickCallback : measureClick,
                                              measureChangeCallback: measureChange,
                                              pageWidth: pageWidth,
                                              defaultMeasure: -1,
                                              bottomPadding: 10,
                                              consumerKey: consumerKey,
                                              scrollToMeasure:true
                                              });
              var instruments = new Array();
              $.each(data.metadata.parts, function(index, part) {
                     var program = parseInt(part.part.program);
                     if (program == 128)
                     program = 118;
                     if ($.inArray(program, instruments) == -1)
                     instruments.push(program);
                     }
                     );
              console.log(instruments);
              console.log('before load');
              if(!iteration) {
              iteration++;
                MIDI.loadPlugin({
                              soundfontUrl: "./soundfont/",
                              instruments: instruments,
                              callback: function() {
                              player = MIDI.Player;
                              player.timeWarp = 1; // speed the song is played back
                              console.log('loading =' + 'http://static.musescore.com/' + scoreId + '/'+ scoreSecret +'/score.mid?nocache');
                              player.loadFile('http://static.musescore.com/' + scoreId + '/'+ scoreSecret +'/score.mid', MIDIPlayerReady);
                              MIDI.loader.stop();
                              }
                              });
              } else {
                player.loadFile('http://static.musescore.com/' + scoreId + '/'+ scoreSecret +'/score.mid', MIDIPlayerReady);
                autoPlay();
              }
              
              
              
              
              
              $('#smp-tempo-list').change(function(){
                                          console.log($(this).val());
                                          var playing = player.playing;
                                          var ct = player.currentTime;
                                          var tw = player.timeWarp;
                                          var tempo = $(this).find(":selected").attr("data-tempo");
                                          var ntw = parseFloat(tempo);
                                          if(ntw != tw) {
                                          $('#smp-control-play').addClass('smp-control-play-mode');
                                          $('#smp-control-play').removeClass('smp-control-pauze-mode');
                                          player.stop();
                                          player.timeWarp = ntw; // speed the song is played back
                                          
                                          player.loadFile('http://static.musescore.com/' + scoreId + '/'+ scoreSecret +'/score.mid?nocache', function() {
                                                          console.log('score loaded');
                                                          MIDIPlayerReady();
                                                          if(playing) {
                                                          player.currentTime = (ct * ntw) / tw;
                                                          player.start();
                                                          $('#smp-control-play').removeClass('smp-control-play-mode');
                                                          $('#smp-control-play').addClass('smp-control-pauze-mode');
                                                          }
                                                          });
                                          
                                          }
                                          }) ;
              console.log('start playing');
              
              });
    
	var bottomPadding = $("#smp-control").height();
	//stick the footer at the bottom of the page if we're on an iPad/iPhone due to viewport/page bugs in mobile webkit
	if(isMobile)
	{
        $("#smp-control").css("position", "static");
	};
	
	$("#smp-control-measure-goto").val(1);
	$("#smp-control-page-goto").val(1);
	
	$('#smp-control-measure-prev').click(function() {
                                         var m = mpager.cMeasure - 1;
                                         if(mpager.goTo(m))
                                         seekToMeasureId(m);
                                         return false;
                                         });
    
	$('#smp-control-measure-next').click(function() {
                                         var m = mpager.cMeasure + 1;
                                         if(mpager.goTo(m))
                                         seekToMeasureId(m);
                                         return false;
                                         });
	
	$('#smp-control-measure-goto').keypress(function(event) {
                                            if (event.keyCode == '13') {
                                            var measureId = $("#smp-control-measure-goto").val();
                                            if(mpager.goTo(measureId-1))
                                            seekToMeasureId(measureId-1);
                                            return false;
                                            }
                                            });
	
	$('#smp-control-page-prev').click(function() {
                                      if(mpager.prevPage(true))
                                      seekToMeasureId(mpager.cMeasure);
                                      return false;
                                      });
    
	$('#smp-control-page-next').click(function() {
                                      if(mpager.nextPage(true))
                                      seekToMeasureId(mpager.cMeasure);
                                      return false;
                                      });
	
	$('#smp-control-page-goto').keypress(function(event) {
                                         if (event.keyCode == '13') {
                                         var pageNumber = $("#smp-control-page-goto").val();
                                         if(mpager.goToPage(pageNumber-1, true))
                                         seekToMeasureId(mpager.cMeasure);
                                         return false;
                                         }
                                         });
    
    
	
	$('#smp-control-replay').click(function() {
                                   return false;
                                   });
	
	$('#smp-control-play').click(function() {
                                 if($('#smp-control-play').hasClass('smp-control-play-mode')){
                                 if(player.currentTime == 0)
                                 player.start();
                                 else
                                 player.resume();
                                 $('#smp-control-play').removeClass('smp-control-play-mode');
                                 $('#smp-control-play').addClass('smp-control-pauze-mode');
                                 }
                                 else{
                                 if(player.playing)
                                 player.pause();
                                 else
                                 player.stop();
                                 $('#smp-control-play').addClass('smp-control-play-mode');
                                 $('#smp-control-play').removeClass('smp-control-pauze-mode');
                                 }
                                 return false;
                                 });
    
    $.getJSON('http://api.musescore.com/services/rest/score/' + scoreId + "/time.jsonp?secret=" + scoreSecret + "&oauth_consumer_key="+ consumerKey +"&callback=?", function(data) {
              events = data;
              eventsSorted = {};
              for ( var i = 0; i < data.length; i++) {
              events[i].position = parseFloat(events[i].position);
              if( ! eventsSorted[events[i].elid] ) {
              eventsSorted[events[i].elid] = new Array();
              }
              eventsSorted[events[i].elid].push(events[i].position);
              }
              });
	
	plugPiano(); //worked once
}


function  autoPlay() {
    plugPiano();
    if($('#smp-control-play').hasClass('smp-control-play-mode')){
        if(player.currentTime == 0)
            player.start();
        else
            player.resume();
        $('#smp-control-play').removeClass('smp-control-play-mode');
        $('#smp-control-play').addClass('smp-control-pauze-mode');
    }
    else{
        if(player.playing)
            player.pause();
        else
            player.stop();
        $('#smp-control-play').addClass('smp-control-play-mode');
        $('#smp-control-play').removeClass('smp-control-pauze-mode');
    }
    return false;
}
