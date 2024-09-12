var deviceName = 'Dali_control';
var daliGateName=dev["Dali_control/set_gateway_name"]
var last_message;
defineVirtualDevice(deviceName, {
    title: { 'en': 'Dali control', 'ru': 'Управление Дали' },
    cells: {
        set_dali_address: {
            title: 'Set DALI address, dec',
            type: "value",
            value: 1,
            min: 1,
            max: 64,
            order: 0,
            readonly: false
        },
        set_gateway_name: {
            title: 'Set Inner Gateway Name',
            type: "text",
            value: "wb-mdali_1",
            min: 1,
            max: 64,
            readonly: false,
            order: 1,

        },

        OFF_button: {
            title: 'Brightness 0%',
            type: "pushbutton",
            order: 2,

        },
        ON_button: {
            title: 'Brightness 100%',
            type: "pushbutton",
            order: 3,

        },
        set_brightness: {
            title: 'Set brightness',
            type: "range",
            value: 0,
            max: 254,
            order: 4


        },
        upd_level_button: {
            title: 'Update Level',
            type: "pushbutton",
            order: 5


        },
        get_brightness: {
            title: 'Get brightness',
            type: "range",
            value: 0,
            max: 254,
            readonly: true,
            order: 6


        },
        read_panel_address: {
            title: 'Input notif short address',
            type: "value",
            value: 1,
            readonly: true,
            order: 8

        },
        read_panel_numbers: {
            title: 'Input notif  instance numbers',
            type: "value",
            value: 1,
            readonly: true,
            order: 8
        },
        read_panel_text: {
            title: 'Panel input notification',
            type: "text",
            value: 1,
            readonly: true,
            order: 9
        },
        upd_status_button: {
            title: 'Update Status',
            type: "pushbutton",
            order: 11
        },
        status_ballast: {
            title: 'Status of Ballast, 0 = OK',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_lamp_failure: {
            title: 'Lamp Failure, 0=OK',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_lamp_arc_power_on: {
            title: 'Lamp Arc Power On, 0 = OFF',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_limit_error: {
            title: 'Limit Error; 0 = last requested power was OFF or was between MIN..MAX LEVEL',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_fade_ready: {
            title: 'Fade Ready (0 = Ready, 1 = Running)',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_reset_state: {
            title: 'Reset State, 0 = NO',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_missing_short_address: {
            title: 'Missing Short Address, 0 = NO',
            type: "switch",
            value: 0,
            readonly: true
        },
        status_power_failure: {
            title: 'Power Failure 0 = RESET or an arc power control command has been received since the last power-on',
            type: "switch",
            value: 0,
            readonly: true
        },

    }
});
daliGateName=dev["Dali_control/set_gateway_name"]
defineRule("OFF_button_", {
    whenChanged: "Dali_control/OFF_button", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var dali_address = dev["Dali_control/set_dali_address"];

        var message = (((dali_address << 1) + 1) << 8) + 0;

        dev[daliGateName+"/"+"channel1_transmit_16bit_forward"] = message;

    }
});
defineRule("ON_button_", {
    whenChanged: "Dali_control/ON_button", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var dali_address = dev["Dali_control/set_dali_address"];

        var message = ((dali_address << 1) << 8) + 254;

        dev[daliGateName+"/"+"channel1_transmit_16bit_forward"] = message;

    }
});
defineRule("Set_brightness_", {
    whenChanged: "Dali_control/set_brightness", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var dali_address = dev["Dali_control/set_dali_address"];

        var message = ((dali_address << 1) << 8) + newValue;

        dev[daliGateName+"/"+"channel1_transmit_16bit_forward"]= message;

    }
});
defineRule("Get_brightness_", {
    whenChanged: "Dali_control/upd_level_button", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var dali_address = dev["Dali_control/set_dali_address"];
        var message = (((dali_address << 1) + 1) << 8) + 160;
        last_message = "QUERY LEVEL";
        dev[daliGateName+"/"+"channel1_transmit_16bit_forward"] = message;

    }
});
defineRule("Get_status_", {
    whenChanged: "Dali_control/upd_status_button", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var dali_address = dev["Dali_control/set_dali_address"];
        var message = (((dali_address << 1) + 1) << 8) + 144;
        last_message = "QUERY STATUS";
        dev[daliGateName+"/"+"channel1_transmit_16bit_forward"] = message;

    }
});
defineRule("Get_status_read", {
    whenChanged: daliGateName+"/"+"channel1_receive_8bit_backward", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        if (last_message == "QUERY LEVEL") {
            dev["Dali_control/get_brightness"] = newValue;
        }
        if (last_message == "QUERY STATUS") {
            log.info("YUPPI");
            //print(bin(newValue))
            //print(typeof(newValue))
            var binaryString = newValue.toString(2);


            while (binaryString.length < 8) {
                binaryString = '0' + binaryString;
            }
            // Assign to variables
            dev["Dali_control/status_ballast"] = binaryString[7] === '1';
            dev["Dali_control/status_lamp_failure"] = binaryString[6] === '1';
            dev["Dali_control/status_lamp_arc_power_on"] = binaryString[5] === '1';
            dev["Dali_control/status_limit_error"] = binaryString[4] === '1';
            dev["Dali_control/status_fade_ready"] = binaryString[3] === '1';
            dev["Dali_control/status_reset_state"] = binaryString[2] === '1';
            dev["Dali_control/status_missing_short_address"] = binaryString[1] === '1';
            dev["Dali_control/status_power_failure"] = binaryString[0] === '1';
        }
    }

}
);


defineRule("Get_event_massage_", {
    whenChanged: daliGateName+"/"+"recive_24_bit", // топик, при изменении которого сработает правило
    then: function (newValue, devName, cellName) {
        var binaryString = newValue.toString(2);  //приходит 32бит с выравниванием по левому краю
        var binaryString24 = binaryString.slice(0, -8);// обрезаем 32 до 24 бит
        binaryString = binaryString.slice(0, -8);
        while (binaryString24.length < 24) {  // дополняем до 24 символов
            binaryString24 = '0' + binaryString24;
        }
        log.info(binaryString24);
        var shortAddress = binaryString24.slice(1, 7);
        log.info(shortAddress);

        var instanceNumber = binaryString24.slice(9, 14);
        log.info(instanceNumber);

        var eventNumber = binaryString24.slice(14, 24);
        log.info(eventNumber);

        dev["Dali_control/read_panel_address"] = parseInt(shortAddress, 2);
        dev["Dali_control/read_panel_numbers"] = parseInt(instanceNumber, 2);

        var eventText;
        switch (eventNumber) {
            case "0000000000": eventText = "Button released"; break;
            case "0000000001": eventText = "Button pressed"; break;
            case "0000000010": eventText = "Short press"; break;
            case "0000000101": eventText = "Double press"; break;
            case "0000001001": eventText = "Long press start"; break;
            case "0000001011": eventText = "Long press repeat"; break;
            case "0000001100": eventText = "Long press stop"; break;
            case "0000001111": eventText = "Button stuck"; break;
            case "0000001110": eventText = "Button free"; break;
        }
        dev["Dali_control/read_panel_text"] = eventText;
        dev[daliGateName+"/"+"channel1_transmit_24bit_forward"] = 270532608

    }
});
