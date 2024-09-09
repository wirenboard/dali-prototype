# Прототип управляющего устройства DALI

* Шаблон устройства на основе wb-ref (ModBus адрес по умолчанию 01)  [/wb-mqtt-serial-template/wb-dali.json](https://github.com/wirenboard/wb-mqtt-serial/blob/feature/add-template-wb-dali/templates/config-wb-dali.json)
* Виртуальное устройство для управления димерами\чтение кнопок `/wb-rules/dali_control.js`
* Виртуальное устройство для сканирования шины DALI (пока только  Control devices) `/wb-rules/dali_scan.js`
