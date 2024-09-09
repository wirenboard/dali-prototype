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
    whenChanged: "Dali_scanner/buttonStartScanner", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        scanner()
    }
});

var high_byte
var mid_byte
var low_byte
function scanner() {
    dev["Dali_scanner/status"] = "Run"

    var short_add = 0
    dev["Dali_scanner/count_found_device"] = short_add
    var shot_list=[];
    dev["Dali_scanner/list_of_short_address"] = "None"
    low_longadd = 0x000000
    high_longadd = 0xFFFFFF
    sendCmd(0xA5, 0)
    sendCmd(0xA5, 0)
    sendCmd(0xA7, 0)
    sendCmd(0xA7, 0)
    longadd = ((low_longadd + high_longadd) / 2) | 0;
    while ((longadd <= (0xFFFFFF - 2)) && short_add <= 64) {
        while (high_longadd - low_longadd > 1) {

            high_byte, mid_byte, low_byte = split_24bit_number(longadd)
            sendCmd(0xB1, high_byte)
            sendCmd(0xB3, mid_byte)
            sendCmd(0xB5, low_byte)            
            sendCmd(0xA9, 0)
            syncDelay(200)
            var uuidFound;
            uuidFound = dev["wb_dali_1/recive_on_compare"]
            if (uuidFound == 1) {
                high_longadd = longadd
            }
            else {
                low_longadd = longadd
            }
            log.info("low_longadd--",low_longadd.toString(16),"--longadd: ", longadd.toString(16),"--high_longadd--",high_longadd.toString(16),"FOUND--",uuidFound)

            longadd = ((low_longadd + high_longadd) / 2) | 0;
        }
        if (high_longadd != 0xFFFFFF) {
            short_add = short_add + 1
            longadd = longadd + 1
            high_byte, mid_byte, low_byte = split_24bit_number(longadd)
            sendCmd(0xB1, high_byte)
            sendCmd(0xB3, mid_byte)
            sendCmd(0xB5, low_byte)
            sendCmd(0xB7, (short_add << 1) + 1)
            sendCmd(0xAB, 0)


            log.info(longadd.toString(16), "--PRORGAM SHORT ADDRESS=", short_add)


            sendCmd(((short_add << 1) + 1), 0xC2)
            sendCmd(((short_add << 1) + 1), 0xC3)
            sendCmd(((short_add << 1) + 1), 0xC4)

            sendBright(short_add, 0)
            sendBright(short_add, 0xFE)
            sendBright(short_add, 0)
            shot_list.push(short_add);
            dev["Dali_scanner/list_of_short_address"] =shot_list.join(", ")
            dev["Dali_scanner/count_found_device"] = short_add
            high_longadd = 0xFFFFFF
            longadd = ((low_longadd + high_longadd) / 2) | 0;
        }
        else {
            log.info("END")
        }
    }
    log.info("END 2")

    sendCmd(0xA1, 0)
    dev["Dali_scanner/status"] = "End"

}

function sendCmd(cmd, data) {
    dev["wb_dali_1/transmit_16_bit"] = (cmd << 8) + data;
    syncDelay(50)

}
function sendBright(cmd, data) {
    dev["wb_dali_1/transmit_16_bit"] = (((cmd << 1)) << 8) + data;
    syncDelay(100)
}
function split_24bit_number(longadd) {
    // Извлекаем старший байт (8 старших бит)
    high_byte = (longadd >> 16) & 0xFF

    // Извлекаем средний байт (средние 8 бит)
    mid_byte = (longadd >> 8) & 0xFF

    // Извлекаем младший байт (8 младших бит)
    low_byte = longadd & 0xFF

    return high_byte, mid_byte, low_byte
}
function syncDelay(milliseconds) {
    var start = new Date().getTime();
    var end = 0;
    while ((end - start) < milliseconds) {
        end = new Date().getTime();
    }
}