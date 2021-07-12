var memberId;
var myselfId;
var mateId;

document.addEventListener("DOMContentLoaded", function() {
    init();
    updateProfiles();
	bindEvents();
});

function init() {
    var parameter = getUrlparameter();
    memberId = parameter.sid;
    myselfId = parameter.id;
    mateId = parameter.mid;
}

function updateProfiles() {
    requestStudents(function(students) {
        updateProfile(getStudent(students, myselfId), "#myself");
        updateProfile(getStudent(students, mateId), "#mate");
        setVisibility(".profilesContainer", true);
    });
}

function bindEvents() {
    document.querySelector("#agree").addEventListener('click', function() {
        requestPollSubmit(true);
    });

    document.querySelector("#disagree").addEventListener('click', function() {
        requestPollSubmit(false);
    });
}

// 학생 찾기
function getStudent(students, id) {
    for(var i = 0; i < students.length; i++) {
        var student = students[i];
        if(student.id == id) return student;
    }

    return null;
}

// 프로필 갱신
function updateProfile(student, selector) {
    setVisibility(selector, student ? true : false);

    if(!student) return;

    document.querySelector(selector + " .profileImage").setAttribute("src", "images/avatar/avatar" + fillZero(student.avatarId) + ".png");
    document.querySelector(selector + " .name").innerHTML = student.name;
    document.querySelector(selector + " .statusMessage").innerHTML = student.statusMessage;
}

function requestStudents(callback) {
    request("/student?memberId=" + memberId, function(students) {
        callback(students);
    });
}

function requestPollSubmit(agree) {
    request("/poll/submit?id=" + myselfId + "&agree=" + agree + "&memberId=" + memberId, function(json) {
        alert(json.success ? "설문이 제출되었습니다." : "설문이 종료되었거나 이미 설문에 참여했습니다.");
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

function setVisibility(selector, visibility) {
    document.querySelector(selector).style.visibility = visibility ? "visible" : "hidden";
}

function getUrlparameter() {
    var search = location.search.substring(1);
    return JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
}

function fillZero(number) {
    return (number < 10 ? "0" : "") + number;
}