var studentId = 1;
var memberId = 12;

document.addEventListener("DOMContentLoaded", function() {
    //init();
	bindEvents();
});

function init() {
    var parameter = getUrlparameter(location.href);
    studentId = parameter.id;
    memberId = parameter.memberId;
}

function bindEvents() {
    document.querySelector("#agree").addEventListener('click', function() {
        requestPollSubmit(true);
    });

    document.querySelector("#disagree").addEventListener('click', function() {
        requestPollSubmit(false);
    });
}

function requestPollSubmit(agree) {
    request("/poll/submit?id=" + studentId + "&agree=" + agree + "&memberId=" + memberId, function(json) {
        if(!json.success) console.log("설문이 종료되었거나 이미 설문에 참여했습니다.");
    });
}

function request(url, callback) {
	var xhr = new XMLHttpRequest();
		
	xhr.addEventListener("load", function() {
		if(callback) callback(JSON.parse(xhr.responseText));
	});
	
	xhr.open("GET", url, true);
	xhr.send();
}

function getUrlparameter(url) {
    var result = {};
    var part = parameterPart();
    var parameter = part.split("&");
    for(var i = 0; i < parameter.length; i++) {
            var tokens = parameter[i].split("=");
            if(tokens.length < 2) continue;
            result[tokens[0]] = tokens[1];
    }
    return result;
    function parameterPart() {
            var tokens = url.split("?");
            return tokens.length > 1 ? tokens[1] : "";
    }
}