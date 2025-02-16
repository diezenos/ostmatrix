const SHEET_ID = '1XBZVWqZaTDkGDwxh2O1MJa5GDMYtoN38_qSRONH5wCY'; // *** ВАЖНО! *** Вставьте ID вашей Google Таблицы сюда!
const SHEET_NAME = 'Лист1'; // Или имя вашего листа, если отличается от "Лист1"
const RANK_THRESHOLDS = { // Пороговые значения для рангов
    D: 29,
    C: 59,
    B: 89,
    A: 119,
    S: 120 // и выше
};
const TEACHER_LOGIN = 'OSTTeacher'; // *** ВАЖНО! *** Установите логин для учителя
const TEACHER_PASSWORD = 'Secure10Teacher29Pass38Word47OST56'; // *** ВАЖНО! *** Установите пароль для учителя
// *** ВАЖНО! *** Теперь ФИО учителя тоже константа для *логина учителя*
const TEACHER_FULL_NAME = 'ФИО Учителя по умолчанию'; //  Установите полное ФИО учителя для данного логина


function doGet(e) {
    var page = e.parameter.page;

    if (page == 'student_panel') {
        return HtmlService.createHtmlOutputFromFile('student_panel')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else if (page == 'top') {
        return HtmlService.createHtmlOutputFromFile('top')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .addMetaTag('viewport', 'width=device-width, initial-scale-1');
    }  else if (page == 'teacher_panel') {
        return HtmlService.createHtmlOutputFromFile('teacher_panel')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else if (page == 'login') {
        return HtmlService.createHtmlOutputFromFile('login')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else if (page == 'register') {
        return HtmlService.createHtmlOutputFromFile('register')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    return HtmlService.createHtmlOutputFromFile('index')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


function registerUser(formData) {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var lastRow = sheet.getLastRow();

    var userIdNumber = lastRow;
    var userId = Utilities.formatString('%03d', userIdNumber);

    var logins = sheet.getRange('A2:A').getValues().flat().filter(String);
    if (logins.includes(formData.login)) {
        return { success: false, message: 'Логин уже занят. Выберите другой логин.' };
    }

    var initialRatings = {
        academicRating: 0,
        selfRealRating: 0,
        socialRating: 0,
        specRating: 0,
        uniqueRating: 0
    };
    var overallRating = calculateOverallRating(initialRatings);
    var rank = calculateRank(overallRating);

    sheet.appendRow([
        formData.login,
        formData.password,
        'student', // Роль всегда "student" при регистрации
        userId,
        formData.firstName,
        formData.lastName,
        formData.nickname,
        formData.specialization,
        initialRatings.academicRating,
        initialRatings.selfRealRating,
        initialRatings.socialRating,
        initialRatings.specRating,
        initialRatings.uniqueRating,
        overallRating,
        rank,
        '' // Пустое поле для "ФИО учителя" при регистрации ученика
    ]);

    return { success: true, message: 'Регистрация прошла успешно!' };
}


function loginUser(formData) {
    if (formData.role === 'teacher') {
        if (formData.login === TEACHER_LOGIN && formData.password === TEACHER_PASSWORD && formData.firstName === TEACHER_FIRST_NAME && formData.middleName === TEACHER_MIDDLE_NAME && formData.lastName === TEACHER_LAST_NAME) {
            return { success: true, message: 'Вход учителя выполнен!', role: 'teacher', teacherName: TEACHER_FULL_NAME }; // Возвращаем ФИО учителя!
        } else {
            return { success: false, message: 'Неверные данные учителя.' };
        }
    } else { // Роль ученика
        var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
        var logins = sheet.getRange('A2:N').getValues();

        for (var i = 0; i < logins.length; i++) {
            var userLogin = logins[i][0];
            var userPassword = logins[i][1];
            var userRole = logins[i][2];
            var overallRating = calculateRatingFormula(logins[i]);
            var rank = calculateRank(overallRating);

            if (userLogin === formData.login && userPassword === formData.password && userRole === 'student') { // Проверяем роль явно на "student"
                return { success: true, message: 'Вход ученика выполнен!', role: userRole, overallRating: overallRating, rank: rank };
            }
        }
        return { success: false, message: 'Неверный логин или пароль ученика.' };
    }
}

function getStudentByName(studentName) {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var students = [];

    for (var i = 1; i < data.length; i++) { // Начинаем со второй строки, пропуская заголовки
        var firstName = data[i][4]; // Имя в 5-м столбце (индекс 4)
        var lastName = data[i][5];  // Фамилия в 6-м столбце (индекс 5)
        var nickname = data[i][6]; // Прозвище в 7-м столбце (индекс 6)
        var specialization = data[i][7]; // Специализация в 8-м столбце (индекс 7)
        var overallRating = calculateRatingFormula(data[i]);
        var rank = calculateRank(overallRating);

        if (firstName.toLowerCase().includes(studentName.toLowerCase()) || lastName.toLowerCase().includes(studentName.toLowerCase())) {
            students.push({
                userId: data[i][3],
                firstName: firstName,
                lastName: lastName,
                nickname: nickname,
                specialization: specialization,
                overallRating: overallRating,
                rank: rank
            });
        }
    }
    return students;
}


function calculateOverallRating(ratings) {
    var sum = 0;
    for (var rating in ratings) {
        sum += ratings[rating];
    }
    return Math.round(sum); // Общий рейтинг теперь сумма баллов, без деления на 5
}


function calculateRank(overallRating) {
    if (overallRating <= RANK_THRESHOLDS.D) {
        return 'D';
    } else if (overallRating <= RANK_THRESHOLDS.C) {
        return 'C';
    } else if (overallRating <= RANK_THRESHOLDS.B) {
        return 'B';
    } else if (overallRating <= RANK_THRESHOLDS.A) {
        return 'A';
    } else {
        return 'S';
    }
}


function getTopUsers() {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var users = [];

    for (var i = 1; i < data.length; i++) {
        var user = {
            lastName: data[i][5], // Используем фамилию для топа
            overallRating: calculateRatingFormula(data[i]),
            rank: calculateRank(calculateRatingFormula(data[i]))
        };
        users.push(user);
    }

    users.sort(function(a, b) {
        return b.overallRating - a.overallRating;
    });

    return users;
}


function getStudentProfile(login) { // Роль больше не передается, определяем по логину
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
        var userLogin = data[i][0];

        if (userLogin === login) {
            var studentProfile = {
                userId: data[i][3],
                firstName: data[i][4],
                lastName: data[i][5],
                nickname: data[i][6],
                specialization: data[i][7],
                overallRating: calculateRatingFormula(data[i]),
                rank: calculateRank(calculateRatingFormula(data[i]))
            };
            return studentProfile;
        }
    }
    return null;
}


function calculateRatingFormula(userData) {
    var academicRating = userData[8] || 0; // столбец I (индекс 8)
    var selfRealRating = userData[9] || 0; // столбец J (индекс 9)
    var socialRating = userData[10] || 0; // столбец K (индекс 10)
    var specRating = userData[11] || 0;  // столбец L (индекс 11)
    var uniqueRating = userData[12] || 0; // столбец M (индекс 12)

    var totalPoints = academicRating + selfRealRating + socialRating + specRating + uniqueRating;
    var overallRating = totalPoints; // Общий рейтинг теперь равен сумме баллов

    return Math.round(overallRating);
}


function updateStudentRatings(studentId, ratings, teacherName) { // <---- Добавлен параметр teacherName
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    var headerRow = 1;

    for (var i = headerRow; i < data.length; i++) {
        var userId = data[i][3];

        if (userId === studentId) {
            sheet.getRange(i + 1, 9).setValue(ratings.academicRating);
            sheet.getRange(i + 1, 10).setValue(ratings.selfRealRating);
            sheet.getRange(i + 1, 11).setValue(ratings.socialRating);
            sheet.getRange(i + 1, 12).setValue(ratings.specRating);
            sheet.getRange(i + 1, 13).setValue(ratings.uniqueRating);
            sheet.getRange(i + 1, 16).setValue(teacherName); // <---- Записываем ФИО учителя в новый столбец!

            var userData = sheet.getRange(i + 1, 1, 1, data[0].length).getValues()[0];
            var overallRating = calculateRatingFormula(userData);
            var rank = calculateRank(overallRating);
            sheet.getRange(i + 1, 14).setValue(overallRating);
            sheet.getRange(i + 1, 15).setValue(rank);

            return { success: true, message: 'Рейтинги ученика с ID ' + studentId + ' обновлены!' };
        }
    }
    return { success: false, message: 'Ученик с ID ' + studentId + ' не найден.' };
}