var deviceName = 'Dali_scanner';
var last_message;

defineVirtualDevice(deviceName, {
    title: { 'en': 'Dali scaner', 'ru': 'Сканирование Дали' },
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
var short_add = 0;
var low_longadd = 0x000000;
var high_longadd = 0xFFFFFF;
var shot_list = [];

function scanner() {
    dev["Dali_scanner/status"] = "Run";
    short_add = 0;
    dev["Dali_scanner/count_found_device"] = short_add;
    shot_list = [];
    dev["Dali_scanner/list_of_short_address"] = "None";
    low_longadd = 0x000000;
    high_longadd = 0xFFFFFF;
    sendCmd(0xA5, 0, function () {
        sendCmd(0xA5, 0, function () {
            sendCmd(0xA7, 0, function () {
                sendCmd(0xA7, 0, function () {
                    scanLoop();
                });
            });
        });
    });
}

function scanLoop() {
    var longadd = ((low_longadd + high_longadd) / 2) | 0;

    if ((longadd <= (0xFFFFFF - 2)) && short_add <= 64) {
        if (high_longadd - low_longadd > 1) {
            high_byte = (longadd >> 16) & 0xFF;
            mid_byte = (longadd >> 8) & 0xFF;
            low_byte = longadd & 0xFF;
            sendCmd(0xB1, high_byte, function () {
                sendCmd(0xB3, mid_byte, function () {
                    sendCmd(0xB5, low_byte, function () {
                        sendCmd(0xA9, 0, function () {
                            setTimeout(function () {
                                var uuidFound = dev["wb_dali_1/recive_on_compare"];
                                if (uuidFound == 1) {
                                    high_longadd = longadd;
                                } else {
                                    low_longadd = longadd;
                                }
                                log.info("low_longadd--", low_longadd.toString(16), "--longadd: ", longadd.toString(16), "--high_longadd--", high_longadd.toString(16), "FOUND--", uuidFound);
                                scanLoop(); // Continue the loop
                            }, 200);
                        });
                    });
                });
            });
        } else {
            if (high_longadd != 0xFFFFFF) {
                short_add++;
                longadd++;
                high_byte = (longadd >> 16) & 0xFF;
                mid_byte = (longadd >> 8) & 0xFF;
                low_byte = longadd & 0xFF; sendCmd(0xB1, high_byte, function () {
                    sendCmd(0xB3, mid_byte, function () {
                        sendCmd(0xB5, low_byte, function () {
                            sendCmd(0xB7, (short_add << 1) + 1, function () {
                                sendCmd(0xAB, 0, function () {
                                    log.info(longadd.toString(16), "--PROGRAM SHORT ADDRESS=", short_add);
                                    sendCmd(((short_add << 1) + 1), 0xC2, function () {
                                        sendCmd(((short_add << 1) + 1), 0xC3, function () {
                                            sendCmd(((short_add << 1) + 1), 0xC4, function () {
                                                sendBright(short_add, 0, function () {
                                                    sendBright(short_add, 0xFE, function () {
                                                        sendBright(short_add, 0, function () {
                                                            shot_list.push(short_add);
                                                            dev["Dali_scanner/list_of_short_address"] = shot_list.join(", ");
                                                            dev["Dali_scanner/count_found_device"] = short_add;
                                                            high_longadd = 0xFFFFFF;
                                                            scanLoop(); // Continue the loop
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                log.info("END");
                endScanner();
            }
        }
    } else {
        log.info("END 2");
        endScanner();
    }
}

function endScanner() {
    sendCmd(0xA1, 0, function () {
        dev["Dali_scanner/status"] = "End";
    });
}

function sendCmd(cmd, data, callback) {
    dev["wb_dali_1/transmit_16_bit"] = (cmd << 8) + data;
    setTimeout(callback, 100); // Wait for 100 ms
}

function sendBright(cmd, data, callback) {
    dev["wb_dali_1/transmit_16_bit"] = (((cmd << 1)) << 8) + data;
    setTimeout(callback, 100); // Wait for 100 ms
}

function split_24bit_number(longadd) {
    var high_byte = (longadd >> 16) & 0xFF;
    var mid_byte = (longadd >> 8) & 0xFF;
    var low_byte = longadd & 0xFF;
    return high_byte, mid_byte, low_byte;
}
