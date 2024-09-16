var deviceName = 'Dali_scanner';
var daliGateName = 'wb-mdali_1'; // Имя устройства
var last_message;

// Определяем переменные для пауз
var initialPause = 530;         // Пауза перед первой последовательностью команд
var betweenSequencesPause = 530; // Пауза перед началом сканирования
var commandDelay = 70;          // Пауза между командами
var uuidReadDelay = 500;        // Пауза перед чтением uuidFound

defineVirtualDevice(deviceName, {
    title: { 'en': 'Dali scanner', 'ru': 'Сканирование Дали' },
    cells: {
        buttonStartScanner: {
            title: 'buttonStartScanner',
            type: "pushbutton"
        },
        count_found_device: {
            title: 'Number of found devices',
            type: "value",
            value: 0
        },
        list_of_short_address: {
            title: 'List of addresses, dec',
            type: "text",
            value: "None"
        },
        status: {
            title: 'Status',
            type: "text",
            value: "None"
        }
    }
});

defineRule("buttonStartScanner", {
    whenChanged: "Dali_scanner/buttonStartScanner",
    then: function (newValue, devName, cellName) {
        scanner();
    }
});

var high_byte, mid_byte, low_byte;

function scanner() {
    dev["Dali_scanner/status"] = "Run";

    var short_add = 0;
    dev["Dali_scanner/count_found_device"] = short_add;
    var shot_list = [];
    dev["Dali_scanner/list_of_short_address"] = "None";
    var low_longadd = 0x000000;
    var high_longadd = 0xFFFFFF;

    // Первая последовательность команд с паузой commandDelay
    executeCommandSequence([
        { cmd: 0xA1, data: 0 },
        { cmd: 0xA1, data: 0 }
    ], commandDelay, function() {
        setTimeout(function() {
            // Вторая последовательность команд с паузой commandDelay
            executeCommandSequence([
                { cmd: 0xA5, data: 0 },
                { cmd: 0xA5, data: 0 },
                { cmd: 0xA7, data: 0 },
                { cmd: 0xA7, data: 0 }
            ], commandDelay, function() {
                setTimeout(function() {
                    // Начало сканирования после паузы betweenSequencesPause
                    performScan(low_longadd, high_longadd, short_add, shot_list);
                }, betweenSequencesPause);
            });
        }, initialPause);
    });
}

function performScan(low_longadd, high_longadd, short_add, shot_list) {
    var longadd = ((low_longadd + high_longadd) / 2) | 0;

    if ((longadd <= (0xFFFFFF - 2)) && short_add <= 64) {
        if (high_longadd - low_longadd > 1) {
            var splitResult = split_24bit_number(longadd);
            high_byte = splitResult[0];
            mid_byte = splitResult[1];
            low_byte = splitResult[2];
            executeCommandSequence([
                { cmd: 0xB1, data: high_byte },
                { cmd: 0xB3, data: mid_byte },
                { cmd: 0xB5, data: low_byte },
                { cmd: 0xA9, data: 0 }
            ], commandDelay, function() {
                // Пауза перед чтением uuidFound
                setTimeout(function() {
                    var uuidFound = dev[daliGateName + "/" + "channel1_bus_state_changed"];
                    if (uuidFound == 1) {
                        high_longadd = longadd;
                    } else {
                        low_longadd = longadd;
                    }
                    log.info("low_longadd--", low_longadd.toString(16), "--longadd: ", longadd.toString(16), "--high_longadd--", high_longadd.toString(16), "FOUND--", uuidFound);
                    performScan(low_longadd, high_longadd, short_add, shot_list);
                }, uuidReadDelay);
            });
        } else if (high_longadd != 0xFFFFFF) {
            short_add++;
            longadd++;
            var splitResult = split_24bit_number(longadd);
            high_byte = splitResult[0];
            mid_byte = splitResult[1];
            low_byte = splitResult[2];
            executeCommandSequence([
                { cmd: 0xB1, data: high_byte },
                { cmd: 0xB3, data: mid_byte },
                { cmd: 0xB5, data: low_byte },
                { cmd: 0xB7, data: (short_add << 1) + 1 },
                { cmd: 0xAB, data: 0 }
            ], commandDelay, function() {
                log.info(longadd.toString(16), "--PROGRAM SHORT ADDRESS=", short_add);
                shot_list.push(short_add);
                dev["Dali_scanner/list_of_short_address"] = shot_list.join(", ");
                dev["Dali_scanner/count_found_device"] = short_add;
                high_longadd = 0xFFFFFF;
                performScan(low_longadd, high_longadd, short_add, shot_list);
            });
        } else {
            log.info("END");
        }
    } else {
        log.info("END 2");
        executeCommandSequence([
            { cmd: 0xA1, data: 0 },
            { cmd: 0xA1, data: 0 }
        ], commandDelay, function() {
            dev["Dali_scanner/status"] = "End";
        });
    }
}

function executeCommandSequence(commands, delay, callback) {
    var currentCommandIndex = 0;

    function processNextCommand() {
        if (currentCommandIndex < commands.length) {
            var command = commands[currentCommandIndex];
            sendCmd(command.cmd, command.data, delay, processNextCommand);
            currentCommandIndex++;
        } else if (callback) {
            callback();
        }
    }

    processNextCommand();
}

function sendCmd(cmd, data, delay, callback) {
    dev[daliGateName + "/" + "channel1_transmit_16bit_forward"] = (cmd << 8) + data;
    setTimeout(callback, delay);
}

function split_24bit_number(longadd) {
    var high_byte = (longadd >> 16) & 0xFF;
    var mid_byte = (longadd >> 8) & 0xFF;
    var low_byte = longadd & 0xFF;
    return [high_byte, mid_byte, low_byte];
}
