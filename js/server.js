var http = require("http");
var fs = require("fs");
var mime = require("mime");
var mysql = require('mysql');

var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : 'gocl213@',
  database : 'findamate'
});

var STUDENT = 0;
var ROUND = 1;
var SCHOOL = 2;
var MEMBER = 3;

var maxStudentId;
var maxRoundId;
var maxSchoolId;
var maxMemberId;

var polls = [];

connection.connect();
init();

// ------------------- 일반 --------------------------

function init() {
        initMaxId("select max(id) as maxId from student", STUDENT);
        initMaxId("select max(id) as maxId from round", ROUND);
        initMaxId("select max(id) as maxId from school", SCHOOL);
        initMaxId("select max(id) as maxId from member", MEMBER);
}

function initMaxId(query, type) {
        connection.query(query, function (error, results, fields) {
                if(error) {     
                        console.log(error);
                        return;
                }

                if(results.length <= 0) return;

                var id = results[0].maxId;

                switch(type) {
                        case STUDENT:
                                maxStudentId = id;
                                break;

                        case ROUND:
                                maxRoundId = id;
                                break;

                        case SCHOOL:
                                maxSchoolId = id;
                                break;

                        case MEMBER:
                                maxMemberId = id;
                                break;
                }
        });
}

function getMateIds(mates, studentId, crossCheck) {
        var result = [];

        mates.forEach(function(mate) {
            if(mate.studentId == studentId) result.push(mate.mateId);
            else if(crossCheck && mate.mateId == studentId) result.push(mate.studentId);
        });

        return result;
}

// ------------------- DB  --------------------------

function querySchool(parameter, callback) {
        var query = "select id, name, year, number from school where memberId = " + parameter.memberId;

        execQuery(query, callback);
}

function queryAddSchool() {
        var query = "insert into school(memberId, name, year, number) values(" + maxMemberId + ", '', '', '')";

        connection.query(query, function (error, results, fields) {
                if(error) {
                        console.log(error);
                        return;
                }
                maxSchoolId++;
        });
}

function queryUpdateSchool(parameter, callback) {
        var query = "update school set name = '" + parameter.name + "', year = " + parameter.year +
        ", number = " + parameter.number + " where memberId = " + parameter.memberId;

        responseQuery(query, callback);
}

function queryStudents(parameter, callback) {
        var query = "select id, name, male, phone, avatarId, score, happiness, statusMessage from student where memberId = " + parameter.memberId;

        execQuery(query, callback);
}

function queryMates(parameter, callback) {
        var query = "select id, studentId, mateId, roundId from mates where memberId = " + parameter.memberId;

        execQuery(query, callback);
}

function queryGetMatesByRoundId(round, callback) {
        var query = "select id, studentId, mateId from mates where roundId = " + round.id;

        connection.query(query, function (error, results, fields) {
            if(error) {
                        console.log(error);
                        return;
                }
                callback(results, round);
        });
}

function queryFavoriteMates(parameter, callback) {
        var query = "select id, studentId, mateId, rank from favoritemates where memberId = " + parameter.memberId;

        execQuery(query, callback);
}

function queryAddStudent(parameter, callback) {
        var male = parameter.male == "true" ? "Y" : "N";
        var statusMessage = parameter.message == undefined ? "" : parameter.message;

        var query = "insert into student(memberId, name, male, phone, avatarId, score, happiness, statusMessage) " +
                "values(" + parameter.memberId + ", '" + parameter.name + "', '" + male + "', '" + parameter.phone +
                "', " + parameter.avatarId + ", " + parameter.score + ", " + parameter.happiness + ", '" + statusMessage + "')";

        responseQuery(query, callback);
}

function queryModifyStudent(parameter, callback) {
        if(parameter.id <= 0 || parameter.id > maxStudentId) return;
        var statusMessage = parameter.statusMessage == undefined ? "" : parameter.statusMessage;

        var male = parameter.male == "true" ? "Y" : "N";
        var query = "update student set name = '" + parameter.name + "', male = '" + male + "', phone = '" + parameter.phone +
        "', avatarId = " + parameter.avatarId + ", score = " + parameter.score + ", happiness = " + parameter.happiness + ", statusMessage = '" +
        statusMessage + "' where id = " + parameter.id;

        responseQuery(query, callback);
}

function queryDeleteStudent(parameter, callback) {
        var id = parameter.id;

        if(id <= 0 || id > maxStudentId) return;

        var query = "delete from student where id = " + id;

        responseQuery(query, callback);
}

function queryAddMate(parameter, callback) {
        var query = "insert into mates(memberId, studentId, mateId, roundId) values(" + parameter.memberId + ", " +
                parameter.studentId + ", " + parameter.mateId + ", " + parameter.roundId + ")";

        responseQuery(query, callback);
}

function queryAddFavorite(parameter, callback) {
        var query = "insert into favoritemates(memberId, studentId, mateId, rank) values(" + parameter.memberId + ", " +
        parameter.studentId + ", " + parameter.mateId + ", " + parameter.rank + ")";

        
        responseQuery(query, callback);
}

function queryDeleteFavorite(parameter, callback) {
        var query = "delete from favoritemates where studentId = " + parameter.studentId + " and rank = " + parameter.rank;

        responseQuery(query, callback);
}

function queryRounds(parameter, callback) {
        var query = "select id, date_format(date, '%Y-%m-%d %H:%i:%S') as date from round where memberId = " + parameter.memberId + " order by id desc";

        execQuery(query, callback);
}

function queryAddRound(parameter, callback) {
       var query = "insert into round(memberId) values(" + parameter.memberId + ")";

        responseQuery(query, callback);
}

function querySignup(parameter, callback) {
        var query = "insert into member(loginId, password) values('" + parameter.loginId + "', '" + parameter.password + "')";

        connection.query(query, function (error, results, fields) {
                if(error) {
                        console.log(error);
                        callback(false);
                        return;
                }

                maxMemberId++;
                callback(true);
        });
}

function queryLogin(parameter, callback) {
        var query = "select id, password from member where loginId = '" + parameter.loginId + "'";

        connection.query(query, function (error, results, fields) {
                if(error) {
                        console.log(error);
                        callback(false, results);
                        return;
                }
                callback(true, results);
        });
}

function execQuery(query, callback) {
        connection.query(query, function (error, results, fields) {
                if(error) {
                        console.log(error);
                        callback(null);
                        return;
                }
                callback(results);
        });
}

function responseQuery(query, callback) {
        connection.query(query, function (error, results, fields) {
                if(error) {
                        console.log(error);
                        callback(false);
                        return;
                }
                callback(true);
        });
}

// ------------------- 전송 요청 처리 (주로직) --------------------------

// ------------------- school 관련 --------------------------

function getSchool(response, parameter) {
        querySchool(parameter, function(schools) {
                var school = (schools && schools.length > 0) ? schools[0] : {};
                delete school.id;
                jsonResponse(response, school);
        });
}

function updateSchool(response, parameter) {
        parameter.name = decodeURIComponent(parameter.name);

        queryUpdateSchool(parameter, function(success) {
                jsonResponse(response, {
                        success: success
                });
        });
}

// ------------------- student 관련 --------------------------

function getStudents(response, parameter) {
        queryStudents(parameter, function(students) {
                queryMates(parameter, function(mates) {
                        queryFavoriteMates(parameter, function(favorites) {
                                students.forEach(function(student) {
                                        var male = student.male;

                                        student.male = male == 'Y' ? true : false;
                                        student.partnerIds = getMateIds(mates, student.id, true);
                                        student.favoritePartnerIds = getMateIds(favorites, student.id);
                                });
                                
                                jsonResponse(response, students);
                        });
                });
        });
}

function addStudent(response, parameter) {
        parameter.name = decodeURIComponent(parameter.name);

        queryAddStudent(parameter, function(success) {
                jsonResponse(response, {
                        id: success ? ++maxStudentId : -1,
                        name: parameter.name,
                        male: parameter.male == "true" ? true : false,
                        phone: parameter.phone,
                        avatarId: parameter.avatarId,
                        statusMessage: parameter.message
                });
        });
}

function modifyStudent(response, parameter) {
        parameter.name = decodeURIComponent(parameter.name);
        parameter.statusMessage = decodeURIComponent(parameter.statusMessage);

        queryModifyStudent(parameter, function(success) {
                jsonResponse(response, {
                        id: success ? parameter.id : -1,
                        name: parameter.name,
                        male: parameter.male == "true" ? true : false,
                        phone: parameter.phone,
                        avatarId: parameter.avatarId,
                        score: parameter.score,
                        happiness: parameter.happiness,
                        statusMessage: parameter.statusMessage
                });
        });
}

function deleteStudents(response, parameter) {
        queryDeleteStudent(parameter, function(success) {
                jsonResponse(response, {
                        success: success
                });
        });
}

// ------------------- mate 관련 --------------------------

function addMate(response, parameter) {
        queryAddMate(parameter, function(success) {
                jsonResponse(response, {
                        success: success
                });
        });
}

// ------------------- favorite 관련 --------------------------

function addFavorite(response, parameter) {
        queryAddFavorite(parameter, function(success) {
                jsonResponse(response, {
                        success: success
                });
        });
}

function deleteFavorite(response, parameter) {
        queryDeleteFavorite(parameter, function(success) {
                jsonResponse(response, {
                        success: success,
                });
        });
}

// ------------------- round 관련 --------------------------

function getRounds(response, parameter) {
        queryRounds(parameter, function(rounds) {
                queryMates(parameter, function(mates) {
                        var histories = [];

                        for(var j = 0; j < rounds.length; j++) {
                                var round = rounds[j];
                                var couples = [];

                                for(var i = 0; i < mates.length; i++) {
                                        var mate = mates[i];

                                        if(mate.roundId != round.id) continue;

                                        couples.push({
                                                studentId1: mate.studentId,
                                                studentId2: mate.mateId
                                        });
                                }

                                histories.push({
                                        id: round.id,
                                        date: round.date,
                                        couples: couples
                                });
                        }

                        jsonResponse(response, histories);        
                });
        });
}

function addRound(response, parameter) {
        queryAddRound(parameter, function(success) {
                jsonResponse(response, {
                        id: success ? ++maxRoundId: -1
                });
        });
}

// ------------------- member 관련 --------------------------

function signup(response, parameter) {
        parameter.name = decodeURIComponent(parameter.name);
        parameter.loginId = decodeURIComponent(parameter.loginId);
        parameter.password = decodeURIComponent(parameter.password);
        parameter.school = decodeURIComponent(parameter.school);

        querySignup(parameter, function(success) {
                if(success) queryAddSchool();

                jsonResponse(response, {
                        success: success
                });
        });
}

function login(response, parameter) {
        queryLogin(parameter, function(success, members) {
                if(success && members.length > 0 && members[0].password == parameter.password) {
                        jsonResponse(response, {
                                success: true,
                                memberId: members[0].id
                        });
                        return;
                }

                jsonResponse(response, {
                        success: false
                });
        });
}

// ------------------- poll 요청 처리 --------------------------

function beginPoll(response, parameter) {
        jsonResponse(response, {
                success: addPoll(parameter)
        });
}

function endPoll(response, parameter) {
        jsonResponse(response, {
                success: removePoll(parameter)
        });
}

function statusPoll(response, parameter) {
        jsonResponse(response, getPollStatus(parameter));
}

function submitPoll(response, parameter) {
        jsonResponse(response, {
                success: updatePoll(parameter)
        });
}

function addPoll(parameter) {
        if(getPoll(parameter)) return false; // 이미 설문이 진행중

        polls.push({
                memberId: parameter.memberId,
                students: []
        });

        return true;
}

function removePoll(parameter) {
        for(var i = 0; i < polls.length; i++) {
                if(polls[i].memberId == parameter.memberId) {
                        polls.splice(i, 1);
                        return true;
                }
        }

        return false;
}

function getPoll(parameter) {
        for(var i = 0; i < polls.length; i++) {
                if(polls[i].memberId == parameter.memberId) return polls[i];
        }

        return null;
}

function getPollStatus(parameter) {
        var poll = getPoll(parameter);

        return poll ? poll.students : [];
}

function updatePoll(parameter) {
        var poll = getPoll(parameter);

        if(!poll) return false; // 설문중 아님

        for(var i = 0; i < poll.students.length; i++) {
                if(poll.students[i].id == parameter.id) return false; // 이미 참여
        }

        poll.students.push({
                id: parameter.id,
                agree: parameter.agree
        });

        return true;
}

// ------------------- 전송 요청 처리 --------------------------

var server = http.createServer(function(request, response) {
    console.log("요청 URL: ", request.url);
    var urlPath = getUrlPath(request.url);
    var filepath = getFilePath(urlPath);
    var contentType = mime.getType(filepath);
    var parameter = getUrlparameter(request.url);

    switch(urlPath) {
        case "/school":
                getSchool(response, parameter);
                return;

        case "/school/update":
                updateSchool(response, parameter);
                return;

        case "/student":
                getStudents(response, parameter);
                return;

        case "/student/add":
                addStudent(response, parameter);
                return;

        case "/student/modify":
                modifyStudent(response, parameter);
                return;

        case "/student/delete":
                deleteStudents(response, parameter);
                return;

        case "/mate/add":
                addMate(response, parameter);
                return;

        case "/favorite/add":
                addFavorite(response, parameter);
                return;

        case "/favorite/delete":
                deleteFavorite(response, parameter);
                return;

        case "/round":
                getRounds(response, parameter);
                return;

        case "/round/add":
                addRound(response, parameter);
                return;

        case "/signup":
                signup(response, parameter);
                return;

        case "/login":
                login(response, parameter);
                return;

        case "/poll/begin":
                beginPoll(response, parameter);
                logPolls();
                return;

        case "/poll/end":
                endPoll(response, parameter);
                logPolls();
                return;

        case "/poll/status":
                statusPoll(response, parameter);
                logPolls();
                return;

        case "/poll/submit":
                submitPoll(response, parameter);
                logPolls();
                return;
    }

    if(isText(contentType)) fs.readFile(filepath, "utf-8", content);
    else fs.readFile(filepath, content);

    function content(error, data) {
            if(error) {
                    response.writeHead(404, {
                            "content-type": "text/plain; charset=utf-8"
                    });
                    response.end("File Not Found");
            }
            else {
                    response.writeHead(200, {
                            "content-type": contentType + (isText(contentType) ? "; charset=utf-8" : ""),
                            "cache-control": isText(contentType) ? "no-cache" : "max-age=31536000"
                    });
                    response.end(data);
            }
    }
});

server.listen(8000, function() {
    console.log("server start!");
});

// ------------------ log ----------------------

function logPolls() {
        console.log(JSON.stringify(polls, null, 5));
}


// ---------------------------------------------

function jsonResponse(response, data) {
    response.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-cache"
    });
    response.end(JSON.stringify(data));
}

function getUrlPath(url) {
    var index = url.indexOf("?");
    return index < 0 ? url : url.substr(0, index);
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

function getFilePath(urlPath) {
    if(urlPath == "/") return "join.html";
    else if(urlPath == "/game") return "yacht.html";
    return urlPath.substr(1, urlPath.length - 1);
}

function isText(contentType) {
    return contentType == "text/html" || contentType == "text/css" || contentType == "application/javascript";
}