/** **========= [ Class ECM221 ] =========**|
 **      ECM Class for data stream A221.
 **    JavaScript ECM Serial Data Decoder
 ** for (94)95 3.8L SFI (L27) VIN:L|(L67) VIN:1
 ** ------------------------------------------
 ** SPECIFICATIONS FOR DATA STREAM INFORMATION
 **      DATA PIN: "M" ON 12 PIN DLC
 **      DATA PIN: "9" ON 16 PIN DLC
 **  BAUD RATE : 8192 BAUD - BI-DIRECTIONAL.
 *******************************************/

/* note: Disconnect Cmd tells ECM to stop listening to actuator cmds.
 * After Connect-CMD Actuator cmds auto reset after 30 seconds or,
 * during scanning, stay engaged until another option is selected.
*/
class ECM221 {
    
    constructor() {

        this.values = {
            engStr: "",
            tranStr: "",
            injector: 0,
            acPsi: 0,
            acVolts: 0,
            activeDTC: 0,
            fanOn: false,
            clutchEngaged: false,
            tccBrakeEngaged: false,
            EGR1: false,
            EGR2: false,
            EGR3: false
        }
        
        /** Variable: this.A_TRANSMISSION
         * * Automatic [true],
         * * Manual [false]. */
        this.A_TRANSMISSION = true;
        
        this.vinDataLength = 48;
        this.engDataLength = 70;
        this.milDataLength = 70;
        
        /** EGR Valve 1,2,3 On (false/true). */
        //this.EGR = [ false, false, false ];
        
        this.COM_PORT = {
            baudRate: 8192, // Required.
            dataBits: 8, // (Opt) Either 7 or 8.
            stopBits: 1, // (Opt) Either 1 or 2.
            parity: "none", // (Opt) enum ParityType {"none", "even", "odd"};
            bufferSize: 76, // (Opt) default 255
            flowControl: "none" // (Opt) enum FlowControlType {"none", "hardware"};
        };
        
        /** DATA-REQUEST Response validation.
        MODE 0  (RETURN TO NORMAL MODE) */
        this.EcmCmdDisConnectDataStream = {
            /* ----Mode [0] Response */
            id: 0xF4,
            messageLength: 0x56,
            mode: 0x00
        };

        /** DATA-REQUEST Response validation.
        (DISABLE NORMAL COMMUNICATIONS) */
        this.EcmCmdStopComDataStream = {
            /* ----Mode [8] Response */
            id: 0xF4,
            messageLength: 0x56,
            mode: 0x08
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdMilDataStream = {
            /* ----Mode [1] Message(2) Response */
            id: 0xF4,
            messageLength: 0x99,
            mode: 0x01
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdVinDataStream = {
            /* ----Mode [1] Message(4) Response */
            id: 0xF4,
            messageLength: 0x83,
            mode: 0x01
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdEngineDataStream = {
            /* ----Mode [1] Message(0) Response */
            id: 0xF4,
            messageLength: 0x99,
            mode: 0x01
        };

        /** Ecm Cmds order number */
        this.EcmCmdNums = {
            engineDataCmdNum: 0,
            milDataCmdNum: 1,
            vinDataCmdNum: 2,
            stopComCmdNum: 3,
            msg1: 4,
            msg2: 5,
            msg3: 6,
            disconnectEcmCmdNum: 7,
            resetMilCmdNum: 8,
            reset: 9,
            fanon: 10,
            fanoff: 11,
            milon: 12,
            miloff: 13,
            evapon: 14,
            evapoff: 15,
            acon: 16,
            acoff: 17,
            egr1on: 18,
            egr1off: 19,
            egr2on: 20,
            egr2off: 21,
            egr3on: 22,
            egr3off: 23,
            idle6: 24,
            idle8: 25,
            idle10: 26,
            idle12: 27,
            ResetBLM: 28,
            reset2: 29,
            noCmdNum: 30,
            vinTest: 31,
            engTest: 32,
            milTest: 33
        };
        
        /** DATA-REQUEST COMMANDS. */
        this.EcmCmds = {
/*0*/ engineDataCmd: new Uint8Array([0xF4, 0x57, 0x01, 0x00, 0xB4]),
/*1*/  milDataCmd: new Uint8Array([0xF4, 0x57, 0x01, 0x01, 0xB3]),
/*2*/  vinDataCmd: new Uint8Array([0xF4, 0x57, 0x01, 0x04, 0xB0]),
/*3*/  stopComCmd: new Uint8Array([0xF4, 0x56, 0x08, 0xAE]),
/*4*/     msg1: new Uint8Array([0xF4, 0x57, 0x07, 0xF0, 0xBE]),
/*5*/     msg2: new Uint8Array([0xF4, 0x57, 0x07, 0xF0, 0xBE]),
/*6*/     msg3: new Uint8Array([0xF4, 0x57, 0x07, 0xF0, 0xBE]),
/*7*/ disconnectEcmCmd: new Uint8Array([0xF4, 0x56, 0x00, 0xB6]),
/*8*/ resetMilCmd: new Uint8Array([0xF4, 0x56, 0x0A, 0xAC]), /* MODE 10 (CLEAR MALFUNCTION CODES - TESTER TO ECM) */
/*9*/    reset: new Uint8Array([0xF4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA6]),
/*10*/   fanon: new Uint8Array([0xF4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x96]),
/*11*/  fanoff: new Uint8Array([0xF4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9E]),
/*12*/   milon: new Uint8Array([0xF4, 0x62, 0x04, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA2]),
/*13*/  miloff: new Uint8Array([0xF4, 0x62, 0x04, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA4]),
/*14*/  evapon: new Uint8Array([0xF4, 0x62, 0x04, 0x10, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x86]),
/*15*/ evapoff: new Uint8Array([0xF4, 0x62, 0x04, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x96]),
/*16*/    acon: new Uint8Array([0xF4, 0x62, 0x04, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA4]),
/*17*/   acoff: new Uint8Array([0xF4, 0x62, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA5]),
/*18*/  egr1on: new Uint8Array([0xF4, 0x62, 0x04, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA6]),
/*19*/ egr1off: new Uint8Array([0xF4, 0x62, 0x04, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x26]),
/*20*/  egr2on: new Uint8Array([0xF4, 0x62, 0x04, 0x40, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x26]),
/*21*/ egr2off: new Uint8Array([0xF4, 0x62, 0x04, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x66]),
/*22*/  egr3on: new Uint8Array([0xF4, 0x62, 0x04, 0x20, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x66]),
/*23*/ egr3off: new Uint8Array([0xF4, 0x62, 0x04, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x86]),
/*24*/   idle6: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x30, 0x00, 0x00, 0x46]),
/*25*/   idle8: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x40, 0x00, 0x00, 0x36]),
/*26*/  idle10: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x50, 0x00, 0x00, 0x26]),
/*27*/  idle12: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x60, 0x00, 0x00, 0x16]),
/*28*/ResetBLM: new Uint8Array([0xF4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA6]),
/*29*/  reset2: new Uint8Array([0xF9, 0x5B, 0x04, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x08]),
/*30*/noCmdNum: new Uint8Array([0]),
/*31*/ vinTest: new Uint8Array([0xF4,0x83,0x01,0x32,0x47,0x31,0x46,0x50,0x32,0x32,0x53,0x37,0x53,0x32,0x31,0x38,0x39,0x36,0x32,0x37,0x00,0xF7,0x74,0x0D,0x31,0x36,0x30,0x30,0x33,0x31,0x31,0x30,0x39,0x36,0x37,0x35,0x30,0x37,0x34,0x02,0x00,0xF7,0x74,0x3F,0x00,0xF7,0x74,0x40,0xC3]),
/*32*/ engTest: new Uint8Array([0xF4,0x99,0x01,0x00,0x00,0x7C,0x77,0x66,0xFE,0xFE,0x1C,0x00,0x01,0x00,0x00,0xFF,0xFF,0x04,0x00,0x00,0x00,0x00,0x50,0x0B,0xD0,0x80,0x80,0x66,0x80,0x80,0x66,0x43,0x04,0x00,0xFF,0x00,0x24,0x00,0xC2,0xC0,0x48,0x00,0x00,0x00,0x61,0x27,0xF7,0x02,0x00,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x80,0x00,0x08,0x00,0xC7]),
/*33*/ milTest: new Uint8Array([0xF4,0x99,0x01,0x00,0x00,0x7C,0x77,0x66,0xFE,0xFE,0x1C,0x00,0x01,0x00,0x00,0xFF,0xFF,0x04,0x00,0x00,0x00,0x00,0x50,0x0B,0xD0,0x80,0x80,0x66,0x80,0x80,0x66,0x43,0x04,0x00,0xFF,0x00,0x24,0x00,0xC2,0xC0,0x48,0x00,0x00,0x00,0x61,0x27,0xF7,0x02,0x00,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x80,0x00,0x08,0x00,0xC7])
//Uint8Array([0xE4,0x6B,0x01,0x03,0x00,0x00,0x21,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x8C])
        };

        this.CMDNAMES = Object.keys(this.EcmCmds);

        /** UI Elements to Assign Values. 
        * options: -volts,-msb,-lsb,-tempf,-deg,-blm,-int,-rpm,-cell,-percent,-psi,mseconds,seconds
        */
        this.ENGINE_DATA = {
            byte1: "NotUsed",// FIRST PROM I.D. WORD (MSB)
            byte2: "NotUsed",// SECOND PROM I.D. WORD (LSB) PROM ID = N
            byte3: "coolant-temp-tempf",
            byte4: "manifold-air-temp-tempf",
            byte5: "tps-volts",//"intake-air-temp-tempf",
            byte6: "tps-percent",//"map-sensor-volts",
            byte7: "reference-pulse-mseconds",
            byte8: "rpm",//"tps-volts",
            byte9: "iac-pos",//"tps-percent",
            byte10: "target-idle-rpm",
            byte11: "NotUsed", /* element "mph" required by the UI. */
            byte12: "maf(g/sec)",
            byte13: "engine-load",
            byte14: "NotUsed",//"rpm24x-rpm",
            byte15: "spark-advance-deg",
            byte16: "knock-count",
            byte17: "knock-retard-deg",
            byte18: "O2-volts",// "EGR STATUS",
            byte19: "O2-cross-count",//"blm-cell", /* element "blm-cell" required by the UI. */
            byte20: "blm-cell",//"airfuel", /* element "airfuel" required by the UI. */
            byte21: "fuel-correction",
            byte22: "blm_cell",
            byte23: "NotUsed",//"st-ft-bank-R-int",
            byte24: "NotUsed",//"lt-ft-bank-R-blm",
            byte25: "NotUsed",//"o2-bank-R-volts",
            byte26: "battery", /* element "battery" required by the UI. */ //"st-ft-bank-L-int",
            byte27: "evap-duty-cylcle-percent",//"lt-ft-bank-L-blm",
            byte28: "cam-crank-err-timer",//"o2-bank-L-volts",
            byte29: "weak-cylinder",//"iac-pos",
            byte30: "boost-control",//"min-iac-pos",
            byte31: "NotUsed",//"fuel-pump-volts",
            byte32: "eng-runtime-seconds",//"ac-evap-sensor-tempf",
            byte33: "NotUsed",
            byte34: "NotUsed", // "spark-advance-deg",
            byte35: "egr-volts",//"evap-duty-cylcle-percent",
            byte36: "NotUsed",// "SPI-INPUT-DISCRETES-STATUS-REGISTER-3",
            byte37: "NotUsed",// "ALDL-STATUS",
            byte38: "NotUsed",// "fanOnOff", /* element "fanOnOff" created in the UI. */
            byte39: "mph", /* element "mph" required by the UI. */
            byte40: "gear", /* element "gear" required by the UI. */ //"rpm", /* element "rpm" required by the UI. */
            byte41: "NotUsed",//"ac-transducer-psi",
 
            byte42: "NotUsed",// TORQUE CONVERTER SLIP (FILTERED): RPM = 2N - 255
            byte43: "NotUsed",// TCC PWM SOLENOID DUTY CYCLE %DC = N/2.55 // "brakepressed", // TCC BRAKE
            byte44: "NotUsed",// "INJECTOR FAULT",
            byte45: "NotUsed",
            byte46: "NotUsed",// CRUISE MODE (IF EQUIPPED):
            byte47: "cruise-servo-percent",// CRUISE SERVO POSITION (IF EQUIPPED) % = N/2.55
            byte48: "desired-servo-pos-percent",// DESIRED SERVO POSITION (IF EQUIPPED) % = N/2.55
            byte49: "actual-servo-pos-percent",// ACTUAL SERVO POSITION (IF EQUIPPED) % = N/2.55
            byte50: "cruise-speed-mph",// CRUISE SET SPEED (IF EQUIPPED) MPH = N
            byte51: "rpm/mph",// N/V RATIO N = RPM/MPH
            byte52: "turbine-torq-ft-lbs",// TURBINE TORQUE FOR TORQUE MANAGEMENT FT-LBS = 2N
            byte53: "O2-var",// OXYGEN SENSOR VARIABLE MV = 4.44N
            byte54: "NotUsed",
            byte55: "egr-percent",// EGR ACTUATOR POSITION %POS = N/2.55
            byte56: "des-egr-percent",// DESIRED EGR ACTUATOR POSITION %POS = N/2.55
            byte57: "trans-temp", /* element "trans-temp" required by the UI. DEG C= .75N - 40, DEG F= 1.35N - 40 */
            
            byte58: "NotUsed",// "CURRENT ADAPTIVE MODIFIER",
            byte59: "NotUsed",// "CURRENT ADAPTIVE CELL",
            byte60: "NotUsed",// "1->2 SHIFT ERROR",
            byte61: "NotUsed",// "2->3 SHIFT ERROR",
            byte62: "NotUsed",// "1->2 SHIFT TIME",
            byte63: "NotUsed",// "2->3 SHIFT TIME",
            byte64: "NotUsed",// "TRANS SHIFT ADAPT STATUS",
            byte65: "NotUsed",// "TRANS ADAPTIVE SHIFT CONDITION VIOLATIONS",
            byte66: "milcodes",/* element "milcodes" required by the UI. */
            byte67: "base-pulse-width-mseconds",// BASE PULSE WIDTH
            length: 67
        };
        
        /** Diagnostic Trouble Codes / Malfunction Indicator Light.
         ** DTCCODES[(code + Byte# + bit#) as String]: returns value. */
        this.DTCCODES = {
            code20: "",
            code21: "",
            code22: "",
            code23: "",
            code24: "",
            code25: "",
            code26: "",
            code27: "",
            code30: "",
            code31: "",
            code32: "",
            code33: "",
            code34: "",
            code35: "",
            code36: "",
            code37: "",
            code40: "",
            code41: "",
            code42: "",
            code43: "TRACTION CONTROL ON VEHICLE",
            code44: "ABS INHIBITED",
            code45: "ABS ACTIVE",
            code46: "BRAKE LIMIT SWITCH NOT TRIPPED",
            code47: "BRAKE LIGHT SWITCH TRIPPED",
            code50: "",
            code51: "",
            code52: "",
            code53: "",
            code54: "",
            code55: "",
            code56: "",
            code57: "",
            code60: "",
            code61: "",
            code62: "",
            code63: "",
            code64: "",
            code65: "",
            code66: "",
            code67: "",
            code70: "",
            code71: "",
            code72: "",
            code73: "",
            code74: "",
            code75: "",
            code76: "",
            code77: "",
            code80: "CYLINDER 1 MISFIRING",
            code81: "CYLINDER 2 MISFIRING",
            code82: "CYLINDER 3 MISFIRING",
            code83: "CYLINDER 4 MISFIRING",
            code84: "CYLINDER 5 MISFIRING",
            code85: "CYLINDER 6 MISFIRING",
            code86: "",
            code87: "",
            code90: "HISTORY CODE 123 THROTTLE POSITION HIGH",
            code91: "HISTORY CODE 629 INVALID PASS KEY FREQUENCY",
            code92: "HISTORY CODE 341 INTERMITTENT CAM SIGNAL",
            code93: "HISTORY CODE 321 18X INTERRUPTS LOST",
            code94: "HISTORY CODE 630 BATTERY VOLTAGE OUT OF RANGE",
            code95: "HISTORY CODE 117 COOLANT SENSOR LOW",
            code96: "HISTORY CODE 118 COOLANT SENSOR HIGH",
            code97: "HISTORY CODE 134 ENGINE 02 SENSOR NOT ACTIVE",
            code100: "HISTORY CODE 140 CATALYST 02 SENSOR NOT ACTIVE",
            code101: "HISTORY CODE 137 CATALYST 02 SENSOR LOW",
            code102: "HISTORY CODE 138 CATALYST 02 SENSOR HIGH",
            code103: "HISTORY CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE",
            code104: "HISTORY CODE 113 AIR TEMP SENSOR HIGH",
            code105: "HISTORY CODE 502 VEHICLE SPEED SENSOR LOW",
            code106: "HISTORY CODE 112 AIR TEMP SENSOR LOW",
            code107: "HISTORY CODE 122 THROTTLE POSITION LOW",
            code110: "HISTORY CODE 703 BRAKE SWITCH FAILURE",
            code111: "HISTORY CODE 501 VEHICLE SPEED SENSOR FAILURE",
            code112: "HISTORY CODE 755 F31 TRANSMISSION SOLENOID B FAILURE",
            code113: "HISTORY CODE 361 EST LINE NOT TOGGLING",
            code114: "HISTORY CODE 101 MASS AIR FLOW SENSOR FAILURE",
            code115: "HISTORY CODE 619 OIL CHANGED INPUT FAULT",
            code116: "HISTORY CODE 705 PRNDL SWITCH FAILURE",
            code117: "HISTORY CODE 680 QDM5 FAILURE",
            code120: "HISTORY CODE 640 QDM1 FAILURE",
            code121: "HISTORY CODE 650 QDM2 FAILURE",
            code122: "HISTORY CODE 132 ENGINE 02 SENSOR HIGH",
            code123: "HISTORY CODE 131 ENGINE 02 SENSOR LOW",
            code124: "HISTORY CODE 325 ESC FAILURE",
            code125: "HISTORY CODE 350 EST FAILURE",
            code126: "HISTORY CODE 342 CAM SENSOR FAILURE",
            code127: "HISTORY CODE 740 TCC FAILURE",
            code130: "HISTORY CODE 550 STEPPER MOTOR CRUZ PROBLEM",
            code131: "HISTORY CODE 712 TRANSMISSION TEMP. SENSOR LOW",
            code132: "HISTORY CODE 713 TRANSMISSION TEMP. SENSOR HIGH",
            code133: "HISTORY CODE 625 HARDWARE RESET",
            code134: "HISTORY CODE 660 QDM3 FAILURE",
            code135: "HISTORY CODE 623 PROM ERROR",
            code136: "HISTORY CODE 599 IN CRUZ POWER MANAGEMENT",
            code137: "HISTORY CODE 670 QDM4 FAILURE",
            code140: "HISTORY CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE",
            code141: "HISTORY CODE 406 LINEAR EGR PINTLE POSITION ERROR",
            code142: "HISTORY CODE 558 CRUISE VACUUM DEPLETION",
            code143: "HISTORY CODE 562 VAC MALFUNTION",
            code144: "HISTORY CODE 561 VENT MALFUNCTION",
            code145: "HISTORY CODE 531 A/C LOW FREON",
            code146: "HISTORY CODE 599 626 VATS FAILURE",
            code147: "HISTORY CODE 670 257 BOOST CONTROL FAILURE (OVERBOOST)",
            code150: "HISTORY CODE 274 INJECTORS WIRED INCORRECTLY",
            code151: "HISTORY CODE 573 LOSS OF SERIAL DATA ABS MSG 91",
            code152: "HISTORY CODE 530 A/C PRESSURE SWITCH FAILURE",
            code153: "HISTORY CODE 565 CRUZ SERVO POSITION SENSOR FAILURE",
            code154: "HISTORY CODE 568 CRUZ SYSTEM MALFUNCTION",
            code155: "HISTORY CODE 567 CRUZ SWITCH MALFUNCTION",
            code156: "",//HISTORY CODE NOT USED
            code157: "HISTORY CODE 624 SOFTWARE RESET",
            code160: "HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code161: "HISTORY CODE 171 FUEL TRIM LEAN",
            code162: "HISTORY CODE 172 FUEL TRIM RICH",
            code163: "HISTORY CODE 300 MISFIRE DETECTED",
            code164: "HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code165: "HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code166: "HISTORY CODE 420 CATALYST MONITOR MALFUNCTION",
            code167: "HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code170: "ACTIVE CODE 123 THROTTLE POSITION HIGH",
            code171: "ACTIVE CODE 629 INVALID PASS KEY FREQUENCY",
            code172: "ACTIVE CODE 341 INTERMITTENT CAM SIGNAL",
            code173: "ACTIVE CODE 321 18X INTERRUPTS LOST",
            code174: "ACTIVE CODE 630 BATTERY VOLTAGE OUT OF RANGE",
            code175: "ACTIVE CODE 117 COOLANT SENSOR LOW",
            code176: "ACTIVE CODE 118 COOLANT SENSOR HIGH",
            code177: "ACTIVE CODE 134 ENGINE 02 SENSOR NOT ACTIVE",
            code180: "ACTIVE CODE 140 CATALYST 02 SENSOR NOT ACTIVE",
            code181: "ACTIVE CODE 137 CATALYST 02 SENSOR LOW",
            code182: "ACTIVE CODE 138 CATALYST 02 SENSOR HIGH",
            code183: "ACTIVE CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE",
            code184: "ACTIVE CODE 113 AIR TEMP SENSOR HIGH",
            code185: "ACTIVE CODE 502 VEHICLE SPEED SENSOR LOW",
            code186: "ACTIVE CODE 112 AIR TEMP SENSOR LOW",
            code187: "ACTIVE CODE 122 THROTTLE POSITION LOW",
            code190: "ACTIVE CODE 703 BRAKE SWITCH FAILURE",
            code191: "ACTIVE CODE 501 VEHICLE SPEED SENSOR FAILURE",
            code192: "ACTIVE CODE 755 F31 TRANSMISSION SOLENOID B FAILURE",
            code193: "ACTIVE CODE 361 EST LINE NOT TOGGLING",
            code194: "ACTIVE CODE 101 MASS AIR FLOW SENSOR FAILURE",
            code195: "ACTIVE CODE 619 OIL CHANGED INPUT FAULT",
            code196: "ACTIVE CODE 705 PRNDL SWITCH FAILURE",
            code197: "ACTIVE CODE 680 QDM5 FAILURE",
            code200: "ACTIVE CODE 640 QDM1 FAILURE",
            code201: "ACTIVE CODE 650 QDM2 FAILURE",
            code202: "ACTIVE CODE 132 ENGINE 02 SENSOR HIGH",
            code203: "ACTIVE CODE 131 ENGINE 02 SENSOR LOW",
            code204: "ACTIVE CODE 325 ESC FAILURE",
            code205: "ACTIVE CODE 350 EST FAILURE",
            code206: "ACTIVE CODE 342 CAM SENSOR FAILURE",
            code207: "ACTIVE CODE 740 TCC FAILURE",
            code210: "ACTIVE CODE 550 STEPPER MOTOR CRUZ PROBLEM",
            code211: "ACTIVE CODE 712 TRANSMISSION TEMP. SENSOR LOW",
            code212: "ACTIVE CODE 713 TRANSMISSION TEMP. SENSOR HIGH",
            code213: "ACTIVE CODE 625 HARDWARE RESET",
            code214: "ACTIVE CODE 660 QDM3 FAILURE",
            code215: "ACTIVE CODE 623 PROM ERROR",
            code216: "ACTIVE CODE 599 IN CRUZ POWER MANAGEMENT",
            code217: "ACTIVE CODE 670 QDM4 FAILURE",
            code220: "ACTIVE CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE",
            code221: "ACTIVE CODE 406 LINEAR EGR PINTLE POSITION ERROR",
            code222: "ACTIVE CODE 558 CRUISE VACUUM DEPLETION",
            code223: "ACTIVE CODE 562 VAC MALFUNTION",
            code224: "ACTIVE CODE 561 VENT MALFUNCTION",
            code225: "ACTIVE CODE 531 A/C LOW FREON",
            code226: "ACTIVE CODE 599 626 VATS FAILURE",
            code227: "ACTIVE CODE 670 257 BOOST CONTROL FAILURE (OVERBOOST)",
            code230: "ACTIVE CODE 274 INJECTORS WIRED INCORRECTLY",
            code231: "ACTIVE CODE 573 LOSS OF SERIAL DATA ABS MSG 91",
            code232: "ACTIVE CODE 530 A/C PRESSURE SWITCH FAILURE",
            code233: "ACTIVE CODE 565 CRUZ SERVO POSITION SENSOR FAILURE",
            code234: "ACTIVE CODE 568 CRUZ SYSTEM MALFUNCTION",
            code235: "ACTIVE CODE 567 CRUZ SWITCH MALFUNCTION",
            code236: "",//ACTIVE CODE NOT USED
            code237: "ACTIVE CODE 624 SOFTWARE RESET",
            code240: "ACTIVE CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code241: "ACTIVE CODE 171 FUEL TRIM LEAN",
            code242: "ACTIVE CODE 172 FUEL TRIM RICH",
            code243: "ACTIVE CODE 300 MISFIRE DETECTED",
            code244: "ACTIVE CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code245: "ACTIVE CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code246: "ACTIVE CODE 420 CATALYST MONITOR MALFUNCTION",
            code247: "ACTIVE CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code250: "",
            code251: "",
            code252: "",
            code253: "",
            code254: "",
            code255: "",
            code256: "",
            code257: "",
            code260: "",
            code261: "",
            code262: "",
            code263: "",
            code264: "",
            code265: "",
            code266: "",
            code267: "",
            code270: "",
            code271: "",
            code272: "",
            code273: "",
            code274: "",
            code275: "",
            code276: "",
            code277: "",
            code280: "",
            code281: "",
            code282: "",
            code283: "",
            code284: "",
            code285: "",
            code286: "",
            code287: "",
            code290: "",
            code291: "",
            code292: "",
            code293: "",
            code294: "",
            code295: "",
            code296: "",
            code297: "",
            code300: "",
            code301: "",
            code302: "",
            code303: "",
            code304: "",
            code305: "",
            code306: "",
            code307: "",
            code310: "",
            code311: "",
            code312: "",
            code313: "",
            code314: "",
            code315: "",
            code316: "",
            code317: "",
            code320: "",
            code321: "",
            code322: "",
            code323: "",
            code324: "",
            code325: "",
            code326: "",
            code327: "",
            code330: "",
            code331: "",
            code332: "",
            code333: "",
            code334: "",
            code335: "",
            code336: "",
            code337: "",
            code340: "",
            code341: "",
            code342: "",
            code343: "",
            code344: "",
            code345: "",
            code346: "",
            code347: "",
            code350: "",
            code351: "",
            code352: "",
            code353: "",
            code354: "",
            code355: "",
            code356: "",
            code357: "",
            code360: "",
            code361: "",
            code362: "",
            code363: "",
            code364: "",
            code365: "",
            code366: "",
            code367: "",
            code370: "",
            code371: "",
            code372: "",
            code373: "",
            code374: "",
            code375: "",
            code376: "",
            code377: "",
            code380: "",
            code381: "",
            code382: "",
            code383: "",
            code384: "",
            code385: "",
            code386: "",
            code387: "",
            code390: "",
            code391: "",
            code392: "",
            code393: "",
            code394: "",
            code395: "",
            code396: "",
            code397: "",
            code400: "",
            code401: "",
            code402: "",
            code403: "",
            code404: "",
            code405: "",
            code406: "",
            code407: "",
            code410: "",
            code411: "",
            code412: "",
            code413: "",
            code414: "",
            code415: "",
            code416: "",
            code417: "",
            code420: "",
            code421: "",
            code422: "",
            code423: "",
            code424: "",
            code425: "",
            code426: "",
            code427: "",
            code430: "",
            code431: "",
            code432: "",
            code433: "",
            code434: "",
            code435: "",
            code436: "",
            code437: "",
            code440: "HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code441: "HISTORY CODE 171 FUEL TRIM LEAN",
            code442: "HISTORY CODE 172 FUEL TRIM RICH",
            code443: "HISTORY CODE 300 MISFIRE DETECTED",
            code444: "HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code445: "HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code446: "HISTORY CODE 420 CATALYST MONITOR MALFUNCTION",
            code447: "HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code450: "HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code451: "HISTORY CODE 171 FUEL TRIM LEAN",
            code452: "HISTORY CODE 172 FUEL TRIM RICH",
            code453: "HISTORY CODE 300 MISFIRE DETECTED",
            code454: "HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code455: "HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code456: "HISTORY CODE 420 CATALYST MONITOR MALFUNCTION",
            code457: "HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code460: "HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code461: "HISTORY CODE 171 FUEL TRIM LEAN",
            code462: "HISTORY CODE 172 FUEL TRIM RICH",
            code463: "HISTORY CODE 300 MISFIRE DETECTED",
            code464: "HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code465: "HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code466: "HISTORY CODE 420 CATALYST MONITOR MALFUNCTION",
            code467: "HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code470: "MALF CODE 125 C/L MIN. COOLANT TEMP. TRIP COUNTER LOW BIT",
            code471: "MALF CODE 125 C/L MIN. COOLANT TEMP. TRIP COUNTER HIGH BIT",
            code472: "MALF CODE 171 FUEL TRIM LEAN, LOWER BIT",
            code473: "MALF CODE 171 FUEL TRIM LEAN, HIGHER BIT",
            code474: "MALF CODE 172 FUEL TRIM RICH, LOWER BIT",
            code475: "MALF CODE 172 FUEL TRIM RICH, HIGHER BIT",
            code476: "MALF CODE 300 MISFIRE DETECTED, LOW BIT",
            code477: "MALF CODE 300 MISFIRE DETECTED, HIGHER BIT",
            code480: "MALF CODE 400 LINEAR EGR FLOW TRIP COUNTER, LOWER BIT",
            code481: "MALF CODE 400 LINEAR EGR FLOW TRIP COUNTER, HIGHER BIT",
            code482: "MALF CODE OBD2 DELTA MAP LEGR FLOW FAILURE",
            code483: "MALF CODE OBD2 DELTA MAP LEGR FLOW FAILURE",
            code484: "MALF CODE 420 CATALYST MONITOR MALFUNCTION",
            code485: "MALF CODE 420 CATALYST MONITOR MALFUNCTION",
            code486: "MALF CODE 484 LINEAR EGR FEEDPIPE FAILURE LOW BIT",
            code487: "MALF CODE 484 LINEAR EGR FEEDPIPE FAILURE HIGH BIT",
            code490: "HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME",
            code491: "HISTORY CODE 171 FUEL TRIM LEAN",
            code492: "HISTORY CODE 172 FUEL TRIM RICH",
            code493: "HISTORY CODE 300 MISFIRE DETECTED",
            code494: "HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE",
            code495: "HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE",
            code496: "HISTORY CODE 420 CATALYST MONITOR MALFUNCTION",
            code497: "HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE",
            code500: "",
            code501: "",
            code502: "",
            code503: "",
            code504: "",
            code505: "",
            code506: "",
            code507: "",
            code510: "",
            code511: "",
            code512: "",
            code513: "",
            code514: "",
            code515: "",
            code516: "",
            code517: "",
            code520: "",
            code521: "",
            code522: "",
            code523: "",
            code524: "",
            code525: "",
            code526: "",
            code527: "",
            code530: "",
            code531: "",
            code532: "",
            code533: "",
            code534: "",
            code535: "",
            code536: "",
            code537: "",
            code540: "",
            code541: "",
            code542: "",
            code543: "",
            code544: "",
            code545: "",
            code546: "",
            code547: "",
            code550: "",
            code551: "",
            code552: "",
            code553: "",
            code554: "",
            code555: "",
            code556: "",
            code557: "",
            code560: "",
            code561: "",
            code562: "",
            code563: "",
            code564: "",
            code565: "",
            code566: "",
            code567: "",
            code570: "",
            code571: "",
            code572: "",
            code573: "",
            code574: "",
            code575: "",
            code576: "",
            code577: "",
            code580: "",
            code581: "",
            code582: "",
            code583: "",
            code584: "",
            code585: "",
            code586: "",
            code587: "",
            code590: "",
            code591: "",
            code592: "",
            code593: "",
            code594: "",
            code595: "",
            code596: "",
            code597: "",
            code600: "",
            code601: "",
            code602: "",
            code603: "",
            code604: "",
            code605: "",
            code606: "",
            code607: "",
            code610: "",
            code611: "",
            code612: "",
            code613: "",
            code614: "",
            code615: "",
            code616: "",
            code617: "",
            code620: "",
            code621: "",
            code622: "",
            code623: "",
            code624: "",
            code625: "",
            code626: "",
            code627: "",
            code630: "",
            code631: "",
            code632: "",
            code633: "",
            code634: "",
            code635: "",
            code636: "",
            code637: "",
            code640: "",
            code641: "",
            code642: "",
            code643: "",
            code644: "",
            code645: "",
            code646: "",
            code647: "",
            code650: "",
            code651: "",
            code652: "",
            code653: "",
            code654: "",
            code655: "",
            code656: "",
            code657: "",
            code660: "",
            code661: "",
            code662: "",
            code663: "",
            code664: "",
            code665: "",
            code666: "",
            code667: "",
            code670: "",
            code671: "",
            code672: "",
            code673: "",
            code674: "",
            code675: "",
            code676: "",
            code677: ""
        }; //this.MILCODEIDS = Object.keys(this.DTCCODES);
        
        /** functions Array ECM.processEngData[index](value); */
        this.processEngData = [
            this.byte1,
            this.byte2,
            this.byte3,
            this.byte4,
            this.byte5,
            this.byte6,
            this.byte7,
            this.byte8,
            this.byte9,
            this.byte10,
            this.byte11,
            this.byte12,
            this.byte13,
            this.byte14,
            this.byte15,
            this.byte16,
            this.byte17,
            this.byte18,
            this.byte19,
            this.byte20,
            this.byte21,
            this.byte22,
            this.byte23,
            this.byte24,
            this.byte25,
            this.byte26,
            this.byte27,
            this.byte28,
            this.byte29,
            this.byte30,
            this.byte31,
            this.byte32,
            this.byte33,
            this.byte34,
            this.byte35,
            this.byte36,
            this.byte37,
            this.byte38,
            this.byte39,
            this.byte40,
            this.byte41,
            this.byte42,
            this.byte43,
            this.byte44,
            this.byte45,
            this.byte46,
            this.byte47,
            this.byte48,
            this.byte49,
            this.byte50,
            this.byte51,
            this.byte52,
            this.byte53,
            this.byte54,
            this.byte55,
            this.byte56,
            this.byte57,
            this.byte58,
            this.byte59,
            this.byte60,
            this.byte61,
            this.byte62,
            this.byte63,
            this.byte64,
            this.byte65,
            this.byte66,
            this.byte67
        ];
        
    } /* ================================ End Constructor ================================ */
    
    toString() {return `
MODULE: ECM-221
ENGINE USAGE:
    3.8L  SFI  (L27) (VIN = L)    1994 3,4C, 2,3,4H, 4W 1,2,3U
    3.8L  SFI  (L67) (VIN = 1)    1994 3,4C, 2H
    3.8L  SFI  (L67) (VIN = 1)    1995 3G 3,4C, 2H
    3.8L  SFI  (L27) (VIN = L)    1995 3,4H 4W  1,2,3U
`;}
    
    /* If True, Skip and hide VIN DATA. ECM DS Doesn't say it's provided. */
    hasNoVinData() {return true;}

    getVIN(vin) {
        if (vin.length == 18) {
            let vinStr = "";
            for (let c in vin) {
                vinStr += String.fromCharCode(vin[c]);
            }
            return vinStr;
        } else if (vin.length >= 21) {//49) {
            let vinData = vin.slice(3, 21);
            /*let vinCheckSum = vin[48];
            let vinDataResponse = vin.slice(0, 48);
            let sum = 0;
            for (let b in vinDataResponse) {
                sum = sum + (256 - parseInt(vinDataResponse[b]));
            }
            let checkSumsTest = parseInt(sum % 256) == parseInt(vinCheckSum);
            if (checkSumsTest) {*/
            let vinStr = "";
            for (let c in vinData) {
                vinStr += String.fromCharCode(vinData[c]);
            }
            return vinStr;
            //} else {return "ERROR";}
        } else {return "ERROR";}
    }

    getMIL(value, ecmValues) {
        let dtcStr = "<b style='color:yellow;'>INFORMATION</b><br/>";
        let dtcCodesStr = "";
        let title = true;
        for (let k = 0; k <= 66; k++) {
            if (k == 0) {
                //ecmValues.activeDTC = value[k];
                dtcStr += "LEARNED VALUE OF CABLE LASH FROM SERVO TO THROTTLE: " + (parseInt(value[k]) / 2.56).toFixed() + "%<br/>";
            } else if (k == 1) {
                dtcStr += "TORQUE DUTY CYCLE REQUESTED BY TCS: " + (parseInt(value[k]) / 2.56).toFixed() + "%<br/>";
            } else if (k == 2) {
                dtcStr += "ACTUAL TORQUE DUTY CYCLE DELIVERED: " + (parseInt(value[k]) / 2.56).toFixed() + "%<br/>";
            } else if (k == 4) {
                dtcStr += "TURBINE RPM (MSB): " + value[k] + " RPM<br/>";
            } else if (k == 5) {
                dtcStr += "TURBINE RPM (LSB): " + value[k] + " RPM<br/>";
            } else if (k == 24) {
                dtcStr += "MISFIRING CYLINDER 1 (MSB): " + value[k] + "<br/>";
            } else if (k == 25) {
                dtcStr += "MISFIRING CYLINDER 1 (LSB): " + value[k] + "<br/>";
            } else if (k == 26) {
                dtcStr += "MISFIRING CYLINDER 2 (MSB): " + value[k] + "<br/>";
            } else if (k == 27) {
                dtcStr += "MISFIRING CYLINDER 2 (LSB): " + value[k] + "<br/>";
            } else if (k == 28) {
                dtcStr += "MISFIRING CYLINDER 3 (MSB): " + value[k] + "<br/>";
            } else if (k == 29) {
                dtcStr += "MISFIRING CYLINDER 3 (LSB): " + value[k] + "<br/>";
            } else if (k == 30) {
                dtcStr += "MISFIRING CYLINDER 4 (MSB): " + value[k] + "<br/>";
            } else if (k == 31) {
                dtcStr += "MISFIRING CYLINDER 4 (LSB): " + value[k] + "<br/>";
            } else if (k == 32) {
                dtcStr += "MISFIRING CYLINDER 5 (MSB): " + value[k] + "<br/>";
            } else if (k == 33) {
                dtcStr += "MISFIRING CYLINDER 5 (LSB): " + value[k] + "<br/>";
            } else if (k == 34) {
                dtcStr += "MISFIRING CYLINDER 6 (MSB): " + value[k] + "<br/>";
            } else if (k == 35) {
                dtcStr += "MISFIRING CYLINDER 6 (LSB): " + value[k] + "<br/>";
            } else if (k == 36) {
                dtcStr += "TOTAL FAILED MISFIRING TEST (MSB): " + (parseInt(value[k]) / 2).toFixed() + "<br/>";
            } else if (k == 37) {
                dtcStr += "TOTAL FAILED MISFIRING TEST (LSB): " + (parseInt(value[k]) / 2).toFixed() + "<br/>";
            } else if (k == 38) {
                dtcStr += "TOTAL PASSED MISFIRING TEST (MSB): " + (parseInt(value[k]) / 2).toFixed() + "<br/>";
            } else if (k == 39) {
                dtcStr += "TOTAL PASSED MISFIRING TEST (LSB): " + (parseInt(value[k]) / 2).toFixed() + "<br/>";
            } else if (k == 40) {
                dtcStr += "HIGHEST (EWMA) RPM VALUE SINCE LAST RESET: " + (parseInt(value[k]) * 12.5).toFixed() + " RPM<br/>";
            } else if (k == 41) {
                dtcStr += "HIGHEST (EWMA) MAP VALUE SINCE LAST RESET: " + (parseInt(value[k]) * 5 / 255).toFixed() + " MAP<br/>";
            } else if (k == 42) {
                dtcStr += "MAXIMUM NUMBER OF BITS SET IN MISFIRE HISTORY FLAGWORD: " + value[k] + " BITS<br/>";
            } else if (k == 49) {
                dtcStr += "CAPTURED FAILURE DATA BUFFER: " + value[k] + " COUNTS<br/>";
            } else if (k == 50) {
                dtcStr += "INDICATES IF ACTMLF08 MALFS. WERE EVER SET: " + value[k] + " COUNTS<br/>";
            } else if (k == 51) {
                dtcStr += "LARGEST POSITIVE DELTA REF. FOR 2ND MOST RECENT CYCLE (MSB): " + value[k] + " DELTA<br/>";
            } else if (k == 52) {
                dtcStr += "LARGEST POSITIVE DELTA REF. FOR 2ND MOST RECENT CYCLE (LSB): " + value[k] + " DELTA<br/>";
            } else if (k == 53) {
                dtcStr += "NUMBER OF CATALYST MONITOR PASSES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 54) {
                dtcStr += "NUMBER OF CATALYST MONITOR PASSES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 55) {
                dtcStr += "NUMBER OF CATALYST MONITOR FAILURES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 56) {
                dtcStr += "NUMBER OF CATALYST MONITOR FAILURES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 57) {
                dtcStr += "RPM DIFFERENTIAL: " + value[k] + "<br/>";
            } else if (k == 58) {
                dtcStr += "MAP DIFFERENTIAL: " + value[k] + "<br/>";
            } else if (k == 59) {
                dtcStr += "NUMBER OF DELTA RPM EGR TEST PASSES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 60) {
                dtcStr += "NUMBER OF DELTA RPM EGR TEST PASSES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 61) {
                dtcStr += "NUMBER OF DELTA RPM EGR TEST FAILURES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 62) {
                dtcStr += "NUMBER OF DELTA RPM EGR TEST FAILURES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 63) {
                dtcStr += "NUMBER OF DELTA MAP EGR TEST PASSES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 64) {
                dtcStr += "NUMBER OF DELTA MAP EGR TEST PASSES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 65) {
                dtcStr += "NUMBER OF DELTA MAP EGR TEST FAILURES (MSB): " + value[k] + " NUMBERS<br/>";
            } else if (k == 66) {
                dtcStr += "NUMBER OF DELTA MAP EGR TEST FAILURES (LSB): " + value[k] + " NUMBERS<br/>";
            } else if (value[k] != 0) {
                let n = parseInt(value[k]).toString(2);
                while (n.length != 8) {
                    n = "0" + n;
                }
                if (title) {dtcCodesStr += "<br/><b style='color:yellow;'>DTC DATA</b><br/>";title = false;}
                let dtcCode = n;
                let tc = 7;
                for (let t in dtcCode) {
                    if (dtcCode[t] == "1") {
                        let MilCode = this.DTCCODES["code" + (k + 1).toString() + tc.toString()];
                        if (MilCode != "") { 
                            dtcCodesStr += MilCode + "<br/>";
                            ecmValues.activeDTC++;
                        }
                    }
                    tc--;
                }
            }
        }
        return dtcStr + dtcCodesStr;
    }
    
    /** functions for ECM.processEngData[index](value);*/
    byte1(v, ecmValues) {ecmValues.engStr = ""; ecmValues.tranStr = ""; return v;}/* FIRST PROM I.D. WORD (MSB) */
    byte2(v, ecmValues) {return v;}/* SECOND PROM I.D. WORD (LSB) PROM ID = N */
    byte3(v, ecmValues) {return (1.35 * parseInt(v) - 40).toFixed();}/* COOLANT TEMPERATURE DEG F = 1.35N - 40 */
    byte4(v, ecmValues) {return (1.35 * parseInt(v) - 40).toFixed();}/* MANIFOLD AIR TEMP. SENSOR DEG F = 1.35N - 40 */
    byte5(v, ecmValues) {return (parseInt(v) * 5 / 255).toFixed(1);}/* THROTTLE POSITION SENSOR VOLTS = 5N/255 */
    byte6(v, ecmValues) {return (parseInt(v) / 2.56).toFixed();}/*THROTTLE ANGLE % = N/2.56*/
    byte7(v, ecmValues) {return (parseInt(v) / 65.536).toFixed();}//TIME BETWEEN REFERENCE PULSES (MSB) mSEC = N/65.536
    byte8(v, ecmValues) { if (v != 255) { return (1310720 / parseInt(v)).toFixed();} else { return 0; } }// TIME BETWEEN REFERENCE PULSES (LSB) RPM = 1,310,720/N
    byte9(v, ecmValues) {return v;}// IDLE SPEED, PRESENT IAC MOTOR POSITION COUNTS = POSITION
    byte10(v, ecmValues) {return (12.5 * parseInt(v)).toFixed();} // DESIRED IDLE SPEED RPM = 12.5N
    byte11(v, ecmValues) {return v;}// RAW VALUE MASS AIR FLOW (MSB)
    byte12(v, ecmValues) {return (parseInt(v)/128).toFixed();}/*RAW VALUE MASS AIR FLOW (LSB) GRAMS/SEC. = N/128*/
    byte13(v, ecmValues) {return v;}/* ENGINE LOAD VARIABLE COUNTS = LOAD INDICATION */
    byte14(v, ecmValues) {return v;}// SPARK ADVANCE REL. TO TDC (MSB)
    byte15(v, ecmValues) {return (90 * parseInt(v) / 255).toFixed();}/*SPARK ADVANCE REL. TO TDC (LSB) DEGREES = 90N/255 (N IS SIGNED)*/
    byte16(v, ecmValues) {return v;}/*ELECTRONIC SPARK CONTROL (KNOCK) SIGNAL N = COUNTER*/
    byte17(v, ecmValues) {return (45 * parseInt(v) / 255).toFixed();}/*ELECTRONIC SPARK CONTROL (KNOCK RETARD) DEG = 45N/255*/
    byte18(v, ecmValues) {return (4.44*parseInt(v)).toFixed(1);}/* OXYGEN SENSOR VARIABLE MILLIVOLTS = 4.44N */
    byte19(v, ecmValues) {return v;}// O2 CROSS COUNTS DELTA N = COUNTS
    byte20(v, ecmValues) {return v;}//BLOCK LEARN MULTIPLIER (0 - 2.0 FILTERED) N = COUNTS
    byte21(v, ecmValues) {return v;}// BASE PULSE (FUEL) C.L. CORRECTION , SCALED 1 N = (COUNTS)
    byte22(v, ecmValues) {return v;}// BLOCK LEARN MULTIPLIER CELL NUMBER,0 - 15
    byte23(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>IAC MODE</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-POWER STEERING PRESSURE SWITCH CRAMPED<br/>";
            } else if (tc == 1 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-ALTERNATOR CONTROL INPUT OK<br/>";
            } else if (tc == 6 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-SMCC DISENGAGE (CRUZ BRAKE IS NO SMCC)<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C REQUESTED<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte24(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>PORT A OUTPUT MODE</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON CHECK ENGINE LIGHT<br/>";
            } else if (tc == 1 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON ALTERNATOR CONTROL<br/>";
            } else if (tc == 2 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON OD2 (3E13) (AIR SOLENOID)<br/>";
            } else if (tc == 3 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON SHIFT SOLENOID A<br/>";
            } else if (tc == 4 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON SHIFT SOLENOID B<br/>";
            } else if (tc == 5 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON OD5 (3E16) (SMCC)<br/>";
            } else if (tc == 6 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON OD6 (2C3) (CCR)<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TURN ON FAN 2<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte25(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bits = n;
        let tc = 7;
        let tccStr = "";
        let title = true;
        let titleStr = "<b style='color:yellow;'>TRANSMISSION STATUS</b><br/>";
        for (let t in bits) {
            if (tc == 0) {
                tccStr += bits[t];
                if (tccStr == "0110") {
                    ecmValues.tranStr += "Trans in Park<br/>";
                } else if (tccStr == "0011") {
                    ecmValues.tranStr += "Trans in Reverse<br/>";
                } else if (tccStr == "1010") {
                    ecmValues.tranStr += "Trans in Neutral<br/>";
                } else if (tccStr == "1001") {
                    ecmValues.tranStr += "Trans in Drive 4<br/>";
                } else if (tccStr == "0000") {
                    ecmValues.tranStr += "Trans in Drive 3<br/>";
                } else if (tccStr == "0101") {
                    ecmValues.tranStr += "Trans in Drive 2<br/>";
                } else if (tccStr == "1100") {
                    ecmValues.tranStr += "Trans in Low<br/>";
                }
            } else if (tc == 1) {
                tccStr += bits[t];
            } else if (tc == 2) {
                tccStr += bits[t];
            } else if (tc == 3) {
                tccStr += bits[t];
            } else if (tc == 4 && bits[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-A/C HIGH PRESSURE<br/>";
            } else if (tc == 5 && bits[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-THIS A W - CAR (SMCC POSSIBLE)<br/>";
            } else if (tc == 7 && bits[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-A/C HIGH PRESSURE<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte26(v, ecmValues) {return (parseInt(v) / 10).toFixed(1);}// BATTERY VOLTAGE, A/D COUNTS VOLTS = N/10
    byte27(v, ecmValues) {return (parseInt(v) / 2.56).toFixed();} // CHARCOAL CANISTER PURGE DUTY CYCLE % DC = N/2.56
    byte28(v, ecmValues) {return v;}// CAM CRANK ERROR TIMER N = (COUNTS)
    byte29(v, ecmValues) {return v;}// CURRENT WEAK CYLINDER DETECTED CURRENT WEAK CYLINDER = N [0 = NONE, 1 - 6 ACTUAL CYL. NO.]
    byte30(v, ecmValues) {return (parseInt(v) / 2.56).toFixed();}// TOTAL BOOST CONTROL DUTY CYCLE % DC = N/2.56
    byte31(v, ecmValues) {return v;}// ENGINE RUNNING TIME IN SECONDS (MSB)
    byte32(v, ecmValues) {return v;}// TIME+1 ENGINE RUNNING TIME IN SECONDS (LSB) SECONDS = N
    
    byte33(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ALDL STATUS</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "0") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-VATS FUEL ENABLED<br/>";
            } else if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-VATS FUEL DISABLED<br/>";
            } else if (tc == 1 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-HOT OPEN LOOP<br/>";
            } else if (tc == 2 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-M350 PASSED<br/>";
            } else if (tc == 3 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-ENGINE RUNNING<br/>";
            } else if (tc == 5 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-IN CATALYST PROTECTION<br/>";
            } else if (tc == 6 && bitsALDL[t] == "0") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-LEAN FLAG<br/>";
            } else if (tc == 6 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-RICH FLAG<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CLOSED LOOP<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte34(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>DRIVER SELECT SWITCH</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-SPORTY SHIFT MODE<br/>";
            }
            tc--;
        }
        return -1;
    }
    
    byte35(v, ecmValues) {return (5 * parseInt(v) / 255).toFixed(1);}/* EGR ACTUATOR POSITION LINEARIZED VOLTS = 5N/255 */
    byte36(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>FMD INPUT STATUS</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-P/N MODE<br/>";
            } else if (tc == 1 && bitsALDL[t] == "0") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-IN 2ND GEAR<br/>";
            } else if (tc == 2 && bitsALDL[t] == "0") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-IN 3RD GEAR<br/>";
            } else if (tc == 3 && bitsALDL[t] == "0") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "IN 4TH GEAR<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte37(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>MISC</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-HEATED WINDSHIELD REQUESTED<br/>";
            } else if (tc == 3 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CRUZ DISABLED BY A MALFUNCTION CODE<br/>";
            } else if (tc == 4 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C WAS ON THIS CRANK (DUE TO SLUGGING)<br/>";
            } else if (tc == 5 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CRUZ VAC SOLENOID FEEDBACK STATUS<br/>";
            } else if (tc == 6 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CRUZ VENT SOLENOID FEEDBACK STATUS<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C CLUTCH ON<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte38(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsALDL = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>OUTPUT STATUS BIT STATES</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CANISTER PURGE ON<br/>";
            } else if (tc == 1 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-FAN1 ON<br/>";
            } else if (tc == 2 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-RPM HIGH IN P/N<br/>";
            } else if (tc == 3 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-TCC LOCKED<br/>";
            } else if (tc == 4 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-ALTERNATOR FAULT DETECTED<br/>";
            } else if (tc == 5 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-ENGINE HOT LIGHT ON<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-NORMAL A/C REQUEST HAS TURNED A/C STARTUP<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte39(v, ecmValues) {return v;}

    
    byte40(v, ecmValues) {/*
    F31 TRANSMISSION STATE WORD
        0       1 = INVALID
        1       1 = LOW
        2       1 = DRIVE 2
        3       1 = DRIVE 3
        4       1 = DRIVE 4
        5       1 = NEUTRAL
        6       1 = REVERSE
        7       1 = PARK*/
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let gear = n; 
        let tc = 7; for (let t in gear) { if (gear[t] == "1") { return tc; } tc--; }
        return 0;
    }
    byte41(v, ecmValues) {/*COMMANDED GEAR = N*/
        ecmValues.tranStr += "TRANSMISSION COMMANDED GEAR: " + v + "<br/>";
        return v;}
    byte42(v, ecmValues) { //TORQUE CONVERTER SLIP (FILTERED) RPM: = 2N - 255
        let value = (2 * parseInt(v) - 255).toFixed();
        ecmValues.tranStr += "TORQUE CONVERTER SLIP (FILTERED) " + value + "-rpm<br/>";
        return (2 * parseInt(v) - 255).toFixed();
    }
    byte43(v, ecmValues) {//TCC PWM SOLENOID DUTY CYCLE %DC = N/2.55
        let value = (parseInt(v) / 2.55).toFixed(2);
        ecmValues.tranStr += "TCC DUTY CYCLE: " + value + " %<br/>";
        return value;
    }
    
    byte44(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>TCC MODE</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-APPLY MODE (PWM)<br/>";
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-ON MODE<br/>";
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-RELEASE MODE (PWM)<br/>";
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-OFF MODE<br/>";
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-POSITIVE DELTA TPS RELEASE OF TCC<br/>";
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-TCCRAMP IS NEGATIVE<br/>";
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-TCC SLIP REQUESTED FOR A/C ENGAGEMENT<br/>";
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-ABSOLUTE SLIP HAS EXCEEDED KLOCKH<br/>";
            }
            tc--;
        }
        return v;
    }
    byte45(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>CRUISE CONTROL INPUT</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-C/C SET/CST SW -ON<br/>";
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-C/C RES/ACCEL SW -ON<br/>";
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-C/C ON/OFF SW -ON<br/>";
            } else if (tc == 5) {
                if (bitsAC[t] == "1") {
                    ecmValues.tccBrakeEngaged = true;
                } else {
                    ecmValues.tccBrakeEngaged = false;
                }
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CRUISE BRAKE PRESSED<br/>";
            }
            tc--;
        }
        return v;
    }
    byte46(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>CRUISE MODE</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-OFF<br/>";
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-DISENGAGED<br/>";
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-STANDBY<br/>";
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CRUISE<br/>";
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-RESUME<br/>";
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-ACCELERATE<br/>";
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-COAST<br/>";
            }
            tc--;
        }
        return v;
    }
    
    byte47(v, ecmValues) {return v;}
    byte48(v, ecmValues) {return (parseInt(v) / 2.55).toFixed(2);}
    byte49(v, ecmValues) {return (parseInt(v) / 2.55).toFixed(2);}
    byte50(v, ecmValues) {return v;}
    byte51(v, ecmValues) {return v;}
    byte52(v, ecmValues) {return (parseInt(v) * 2).toFixed();}
    byte53(v, ecmValues) {return (parseInt(v) * 4.44).toFixed(1);}
    byte54(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>PORT A INPUT MODE</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-STARTER OUTPUT HIGH<br/>";
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-VENT OUTPUT HIGH<br/>";
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-VAC OUTPUT HIGH<br/>";
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-FUEL PUMP OUTPUT HIGH<br/>";
            } else if (bitsAC[t] == "0" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-QDM1 HAS A FAULT<br/>";
            } else if (bitsAC[t] == "0" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-QDM2 HAS A FAULT<br/>";
            } else if (bitsAC[t] == "0" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-QDM3 HAS A FAULT<br/>";
            } else if (bitsAC[t] == "0" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-QDM4 HAS A FAULT<br/>";
            }
            tc--;
        }
        return v;
    }
    
    byte55(v, ecmValues) {return (parseInt(v) / 2.55).toFixed(2);}
    byte56(v, ecmValues) {return (parseInt(v) / 2.55).toFixed(2);}
    byte57(v, ecmValues) {return (1.35 * parseInt(v) - 40).toFixed();}
    byte58(v, ecmValues) {
        ecmValues.activeDTC = 0;
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 123 THROTTLE POSITION HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 629 INVALID PASS KEY FREQUENCY<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 341 INTERMITTENT CAM SIGNAL<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 321 18X INTERRUPTS LOST<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 630 BATTERY VOLTAGE OUT OF RANGE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 117 COOLANT SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 118 COOLANT SENSOR HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 134 ENGINE 02 SENSOR NOT ACTIVE<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte59(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 140 CATALYST 02 SENSOR NOT ACTIVE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 137 CATALYST 02 SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 138 CATALYST 02 SENSOR HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 113 AIR TEMP SENSOR HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 502 VEHICLE SPEED SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 112 AIR TEMP SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 122 THROTTLE POSITION LOW<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte60(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 703 BRAKE SWITCH FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 501 VEHICLE SPEED SENSOR FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 755 F31 TRANSMISSION SOLENOID B FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 361 EST LINE NOT TOGGLING<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 101 MASS AIR FLOW SENSOR FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 619 OIL CHANGED INPUT FAULT<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 705 PRNDL SWITCH FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 680 QDM5 FAILURE<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte61(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 640 QDM1 FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 650 QDM2 FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 132 ENGINE 02 SENSOR HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 131 ENGINE 02 SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 325 ESC FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 350 EST FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 342 CAM SENSOR FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 740 TCC FAILURE<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte62(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 550 STEPPER MOTOR CRUZ PROBLEM<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 712 TRANSMISSION TEMP. SENSOR LOW<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 713 TRANSMISSION TEMP. SENSOR HIGH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 625 HARDWARE RESET<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 660 QDM3 FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 623 PROM ERROR<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 599 IN CRUZ POWER MANAGEMENT<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 670 QDM4 FAILURE<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte63(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 406 LINEAR EGR PINTLE POSITION ERROR<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 558 CRUISE VACUUM DEPLETION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 562 VAC MALFUNCTION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 561 VENT MALFUNCTION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 531 A/C LOW FREON<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 626 VATS FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 257 BOOST CONTROL FAILURE (OVERBOOST)<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte64(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 274 INJECTORS WIRED INCORRECTLY<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 573 LOSS OF SERIAL DATA ABS MSG 91<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 530 A/C PRESSURE SWITCH FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 565 CRUZ SERVO POSITION SENSOR FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 568 CRUZ SYSTEM MALFUNCTION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 567 CRUZ SWITCH MALFUNCTION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 624 SOFTWARE RESET<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte65(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ACTIVE MALFUNCTION</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "1" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 171 FUEL TRIM LEAN<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 172 FUEL TRIM RICH<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 3) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 300 MISFIRE DETECTEDbr/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 420 CATALYST MONITOR MALFUNCTION<br/>";
                ecmValues.activeDTC++;
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CODE 484 LINEAR EGR FEEDPIPE FAILURE<br/>";
                ecmValues.activeDTC++;
            }
            tc--;
        }
        return v;
    }
    byte66(v, ecmValues) {return ecmValues.activeDTC;}// BASE PULSE WIDTH (MSB)
    byte67(v, ecmValues) {return (parseInt(v) / 65.536).toFixed();}//BASE PULSE WIDTH (LSB) MSEC = N/65.536
}
/*


                        DATA STREAM A221  SPECIFICATION


..PAGE

   SPECIFICATIONS FOR DATA STREAM INFORMATION
   ------------------------------------------

   ENGINE USAGE:
       3.8L  SFI  (L27) (VIN = L)    1994 3,4C, 2,3,4H, 4W 1,2,3U
       3.8L  SFI  (L67) (VIN = 1)    1994 3,4C, 2H
*      3.8L  SFI  (L67) (VIN = 1)    1995 3G 3,4C, 2H
*      3.8L  SFI  (L27) (VIN = L)    1995 3,4H 4W  1,2,3U



   DATA PIN: READ DATA ON PIN "M" OF OF 12 PIN DLC
   DATA PIN: READ DATA ON PIN "9" OF OF 16 PIN DLC

   BAUD RATE: 8192




..PAGE
MODE 0  (RETURN TO NORMAL MODE)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $00
        - MESSAGE CHECKSUM

        ECM RESPONSE:
         NORMAL MESSAGES


MODE 1  (TRANSMIT FIXED DATA STREAM MESSAGE 0)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $57
        - MODE NUMBER           = $01
        - MESSAGE NUMBER        = $00
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE FOLLOWING MESSAGE:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $99
        - MODE NUMBER           = $01
        - DATA BYTE 1
          .
          .

        - DATA BYTE 67
        - CHECKSUM

MODE 1  (TRANSMIT FIXED DATA STREAM MESSAGE 1)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $57
        - MODE NUMBER           = $01
        - MESSAGE NUMBER        = $01
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE FOLLOWING MESSAGE:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $99
        - MODE NUMBER           = $01
        - DATA BYTE 1
          .
          .

        - DATA BYTE 67
        - CHECKSUM


MODE 7  (COMMAND MESSAGE NORMAL MODE MESSAGE)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $57
        - MODE NUMBER           = $07
        - MESSAGE ID
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE REQUESTED WITH NORMAL MESSAGE

MODE 8  (DISABLE NORMAL COMMUNICATIONS)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $08
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE FOLLOWING MESSAGE:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $08
        - CHECKSUM


..PAGE
MODE 9  (ENABLE NORMAL COMMUNICATIONS)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $09
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE FOLLOWING MESSAGE:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $09
        - CHECKSUM


MODE 10 (CLEAR MALFUNCTION CODES - TESTER TO ECM)
        ALDL REQUEST:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $0A
        - CHECKSUM

        THE ECM WILL RESPOND WITH THE FOLLOWING MESSAGE:
        - MESSAGE ID            = $F4
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $0A
        - CHECKSUM



..PAGE
..HEAD02L ALDL NORMAL MESSAGE *$F0*

        - MESSAGE ID            = $F0
        - MESSAGE LENGTH        = $56
        - MODE NUMBER           = $F4
        - CHECKSUM



..PAGE
..HEAD02L ALDL DATA LIST
..HEAD03L NUMBER OF DATA WORDS - 67
..HEAD04L ALDL MODE 1 DATA LIST MESSAGE 0
WORD DATA NAME     DESCRIPTION

 1   PROM ID       FIRST PROM I.D. WORD (MSB)
 2   PROM ID+1     SECOND PROM I.D. WORD (LSB)
                     PROM ID = N
 3   COOLDEGA      COOLANT TEMPERATURE         (NON-DEFAULTED)
                     DEG C = .75N - 40
                     DEG F = 1.35N - 40
 4   ATSDEGA       MANIFOLD AIR TEMP. SENSOR   (NON-DEFAULTED)
                     DEG C = .75N - 40
                     DEG F = 1.35N - 40
 5   ADTHROT       THROTTLE POSITION SENSOR
                     VOLTS = 5N/255
 6   NTPSLD        THROTTLE ANGLE
                     % = N/2.56
 7   NEWRFPER      TIME BETWEEN REFERENCE PULSES (MSB)
 8   NEWRFPER+1    TIME BETWEEN REFERENCE PULSES (LSB)
                     mSEC = N/65.536
                     RPM = 1,310,720/N
 9   ISSPMP        IDLE SPEED, PRESENT IAC MOTOR POSITION
                     COUNTS = POSITION
 10  ISESDD        DESIRED IDLE SPEED
                     RPM = 12.5N
 11  RAWDSPFL      RAW VALUE MASS AIR FLOW (MSB)
 12  RAWDSPFL+1    RAW VALUE MASS AIR FLOW (LSB)
                     GRAMS/SEC. = N/128
 13  LV8           ENGINE LOAD VARIABLE
                     COUNTS = LOAD INDICATION
 14  SAP           SPARK ADVANCE REL. TO TDC (MSB)
 15  SAP+1         SPARK ADVANCE REL. TO TDC (LSB)
                     DEGREES = 90N/255    (N IS SIGNED)
 16  OLDESCCT      ELECTRONIC SPARK CONTROL (KNOCK) SIGNAL
                     N = COUNTER
 17  NOCKRTD       ELECTRONIC SPARK CONTROL (KNOCK RETARD)
                     DEG = 45N/255
 18  ADO2A         OXYGEN SENSOR VARIABLE
                     MILLIVOLTS = 4.44N
 19  ACNTDEL       O2 CROSS COUNTS DELTA
                     N = COUNTS
 20  BLM           BLOCK LEARN MULTIPLIER (0 - 2.0 FILTERED)
                     N = COUNTS
 21  CORRCL        BASE PULSE (FUEL) C.L. CORRECTION , SCALED 1
                     N = (COUNTS)
 22  BLMCELL       BLOCK LEARN MULTIPLIER CELL NUMBER,0 - 15
                     (NUMBER 0 - 15 POSSIBLE)
 23  IACMW1          IAC MODE WORD 1
        0       1 = POWER STEERING PRESSURE SWITCH CRAMPED
        1       1 = ALTERNATOR CONTROL INPUT OK
        2       NOT USED
        3       NOT USED
        4       NOT USED
        5       NOT USED
        6       1 = SMCC DISENGAGE (CRUZ BRAKE IS NO SMCC)
        7       1 = A/C REQUESTED
 24  IORPAOMW        PORT A OUTPUT MODE WORD
        0       1 = TURN ON CHECK ENGINE LIGHT
        1       1 = TURN ON ALTERNATOR CONTROL
        2       1 = TURN ON OD2 (3E13) (AIR SOLENOID)
        3       1 = TURN ON SHIFT SOLENOID A
        4       1 = TURN ON SHIFT SOLENOID B
        5       1 = TURN ON OD5 (3E16) (SMCC)
        6       1 = TURN ON OD6 (2C3) (CCR)
        7       1 = TURN ON FAN 2
 25  PRNDLSTT        PRNDL STATUS FOR S.D.           PRNDL TABLE
        0       1 = PRNDL P HIGH (SEE TABLE)         -----------
        1       1 = PRNDL C HIGH (SEE TABLE)
        2       1 = PRNDL B HIGH (SEE TABLE)         A B C P  STATE
        3       1 = PRNDL A HIGH (SEE TABLE)         - - - -  -----
        4       1 = A/C HIGH PRESSURE              * 0 1 1 0  PARK
        5       1 = THIS A W - CAR (SMCC POSSIBLE) * 0 0 1 1  REVERSE
        6       NOT USED                           * 1 0 1 0  NEUTRAL
        7       1 = A/C HIGH PRESSURE              * 1 0 0 1  DRIVE 4
                                                   * 0 0 0 0  DRIVE 3
                                                   * 0 1 0 1  DRIVE 2
                                                   * 1 1 0 0  LOW

 26  ADBAT         BATTERY VOLTAGE, A/D COUNTS
                     VOLTS = N/10
 27  PURGEDC       CHARCOAL CANISTER PURGE DUTY CYCLE
                     % DC = N/2.56
 28  M341CNTR      CAM CRANK ERROR TIMER
                     N = (COUNTS)
 29  BADCYL        CURRENT WEAK CYLINDER DETECTED
                     CURRENT WEAK CYLINDER = N
                     (0 = NONE, 1 - 6 ACTUAL CYL. NO.)


 30  BSTDC         TOTAL BOOST CONTROL DUTY CYCLE
                     % DC = N/2.56
 31  TIME          ENGINE RUNNING TIME IN SECONDS (MSB)
 32  TIME+1        ENGINE RUNNING TIME IN SECONDS (LSB)
                     SECONDS = N
 33  ALCLMW2         ALDL DATASTREAM PACKED BIT WORD
        0       VATS FUEL ENABLE               1 = FUEL DISABLED
        1       1 = HOT OPEN LOOP
        2       1 = M350 PASSED
        3       1 = ENGINE RUNNING
        4       NOT USED
        5       1 = IN CATALYST PROTECTION
        6       RICH/LEAN FLAG                           1 = RICH
        7       1 = CLOSED LOOP
 34  ALDLMW1         MISC STATUS WORD
        0       DRIVER SELECT SWITCH           1 = SPORTY SHIFT MODE
        1       NOT USED
        2       NOT USED
        3       NOT USED
        4       NOT USED
        5       NOT USED
        6       NOT USED
        7       NOT USED
 35  ADEGRPOS      EGR ACTUATOR POSITION LINEARIZED
                    VOLTS = 5N/255
 36  GEARSTAT        FMD INPUT STATUS WORD
        0       1 = P/N MODE
        1       0 = IN 2ND GEAR
        2       0 = IN 3RD GEAR
        3       0 = IN 4TH GEAR
        4       NOT USED
        5       NOT USED
        6       NOT USED
        7       NOT USED
 37  QDMMW
        0       HEATED WINDSHIELD STATUS          1 = REQUESTED
        1       NOT USED
        2       NOT USED
        3       1 = CRUZ DISABLED BY A MALFUNCTION CODE
        4       1 = A/C WAS ON THIS CRANK (DUE TO SLUGGING)
        5       CRUZ VAC SOLENOID FEEDBACK STATUS
        6       CRUZ VENT SOLENOID FEEDBACK STATUS
        7       1 = A/C CLUTCH ON
 38  LCCPMW          OUTPUT STATUS BIT STATES
        0       1 = CANISTER PURGE ON
        1       1 = FAN1 ON
        2       1 = RPM HIGH IN P/N
        3       1 = TCC LOCKED
        4       1 = ALTERNATOR FAULT DETECTED
        5       1 = ENGINE HOT LIGHT ON
        6       NOT USED
        7       1 = NORMAL A/C REQUEST HAS TURNED A/C STARTUP
 39  RAWMPH     VEHICLE SPEED
                  MPH = N
 40  PRNDL           F31 TRANSMISSION STATE WORD
        0       1 = INVALID
        1       1 = LOW
        2       1 = DRIVE 2
        3       1 = DRIVE 3
        4       1 = DRIVE 4
        5       1 = NEUTRAL
        6       1 = REVERSE
        7       1 = PARK
 41  GEAR         COMMANDED GEAR:
                          GEAR = N
 42  FDSLIP        TORQUE CONVERTER SLIP (FILTERED):
                     RPM = 2N - 255
 43  TCCDC         TCC PWM SOLENOID DUTY CYCLE
                     %DC = N/2.55
 44  TCCPWMMW        TCC MODE:
        0       1 = APPLY MODE (PWM)
        1       1 = ON MODE
        2       1 = RELEASE MODE (PWM)
        3       1 = OFF MODE
        4       1 = POSITIVE DELTA TPS RELEASE OF TCC
        5       1 = TCCRAMP IS NEGATIVE
        6       1 = TCC SLIP REQUESTED FOR A/C ENGAGEMENT
        7       1 = ABSOLUTE SLIP HAS EXCEEDED KLOCKH
 45  CRUZMW3         CRUISE CONTROL INPUT SWITCHES (IF EQUIPPED):
        0       NOT USED
        1       NOT USED
        2       C/C SET/CST SW      1 = ON
        3       C/C RES/ACCEL SW    1 = ON
        4       C/C ON/OFF SW       1 = ON
        5       TCC BRAKE           0 = PRESSED
        6       CRUZ BRAKE          0 = PRESSED
        7       NOT USED




 46  CRUZMW2         CRUISE MODE (IF EQUIPPED):
                     (BIT THAT IS SET TO 1 DEFINES MODE)
        0       OFF                               1 = OFF MODE
        1       DISENGAGED                        1 = DISENGAGED MODE
        2       STANDBY                           1 = STANDBY MODE
        3       CRUISE                            1 = NORMAL CRUZ MODE
        4       RESUME                            1 = RESUME MODE
        5       ACCELERATE                        1 = ACCEL MODE
        6       COAST                             1 = COAST MODE
        7       NOT USED
 47  ADSERVO       CRUISE SERVO POSITION (IF EQUIPPED)
                     N = COUNTS
 48  DSRVOPOS      DESIRED SERVO POSITION (IF EQUIPPED)
                     % = N/2.55
 49  SERVOPOS      ACTUAL SERVO POSITION (IF EQUIPPED)
                     % = N/2.55
 50  SETSPEED      CRUISE SET SPEED (IF EQUIPPED)
                     MPH = N
 51  NOVERV        N/V RATIO
                     N = RPM/MPH
 52  TURBTRQ       TURBINE TORQUE FOR TORQUE MANAGEMENT
                     FT-LBS = 2N
 53  ADO2B         OXYGEN SENSOR VARIABLE
                     MV = 4.44N
 54  IODPAIMW        PORT A INPUT MODE WORD
        0       1 = STARTER OUTPUT HIGH
        1       1 = VENT OUTPUT HIGH
        2       1 = VAC OUTPUT HIGH
        3       1 = FUEL PUMP OUTPUT HIGH
        4       0 = QDM1 HAS A FAULT
        5       0 = QDM2 HAS A FAULT
        6       0 = QDM3 HAS A FAULT
        7       0 = QDM4 HAS A FAULT
 55  EGRPOS        EGR ACTUATOR POSITION
                     %POS = N/2.55
 56  DSEGRPOS      DESIRED EGR ACTUATOR POSITION
                     %POS = N/2.55
 57  TRANDEGA      TRANSMISSION TEMPERATURE (NON-DEFAULTED)
                     DEG C = .75N - 40
                     DEG F = 1.35N - 40
 58  ACTMLF01        ACTIVE MALFUNCTION FLAG WORD 1
        0       ACTIVE CODE 123 THROTTLE POSITION HIGH
        1       ACTIVE CODE 629 INVALID PASS KEY FREQUENCY
        2       ACTIVE CODE 341 INTERMITTENT CAM SIGNAL
        3       ACTIVE CODE 321 18X INTERRUPTS LOST
        4       ACTIVE CODE 630 BATTERY VOLTAGE OUT OF RANGE
        5       ACTIVE CODE 117 COOLANT SENSOR LOW
        6       ACTIVE CODE 118 COOLANT SENSOR HIGH
        7       ACTIVE CODE 134 ENGINE 02 SENSOR NOT ACTIVE
 59  ACTMLF02        ACTIVE MALFUNCTION FLAG WORD 2
        0       ACTIVE CODE 140 CATALYST 02 SENSOR NOT ACTIVE
        1       ACTIVE CODE 137 CATALYST 02 SENSOR LOW
        2       ACTIVE CODE 138 CATALYST 02 SENSOR HIGH
        3       ACTIVE CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE
        4       ACTIVE CODE 113 AIR TEMP SENSOR HIGH
        5       ACTIVE CODE 502 VEHICLE SPEED SENSOR LOW
        6       ACTIVE CODE 112 AIR TEMP SENSOR LOW
        7       ACTIVE CODE 122 THROTTLE POSITION LOW
 60  ACTMLF03        ACTIVE MALFUNCTION FLAG WORD 3
        0       ACTIVE CODE 703 BRAKE SWITCH FAILURE
        1       ACTIVE CODE 501 VEHICLE SPEED SENSOR FAILURE
        2       ACTIVE CODE 755 F31 TRANSMISSION SOLENOID B FAILURE
        3       ACTIVE CODE 361 EST LINE NOT TOGGLING
        4       ACTIVE CODE 101 MASS AIR FLOW SENSOR FAILURE
        5       ACTIVE CODE 619 OIL CHANGED INPUT FAULT
        6       ACTIVE CODE 705 PRNDL SWITCH FAILURE
        7       ACTIVE CODE 680 QDM5 FAILURE
 61  ACTMLF04        ACTIVE MALFUNCTION FLAG WORD 4
        0       ACTIVE CODE 640 QDM1 FAILURE
        1       ACTIVE CODE 650 QDM2 FAILURE
        2       ACTIVE CODE 132 ENGINE 02 SENSOR HIGH
        3       ACTIVE CODE 131 ENGINE 02 SENSOR LOW
        4       ACTIVE CODE 325 ESC FAILURE
        5       ACTIVE CODE 350 EST FAILURE
        6       ACTIVE CODE 342 CAM SENSOR FAILURE
        7       ACTIVE CODE 740 TCC FAILURE
 62  ACTMLF05        ACTIVE MALFUNCTION FLAG WORD 5
        0       ACTIVE CODE 550 STEPPER MOTOR CRUZ PROBLEM
        1       ACTIVE CODE 712 TRANSMISSION TEMP. SENSOR LOW
        2       ACTIVE CODE 713 TRANSMISSION TEMP. SENSOR HIGH
        3       ACTIVE CODE 625 HARDWARE RESET
        4       ACTIVE CODE 660 QDM3 FAILURE
        5       ACTIVE CODE 623 PROM ERROR
        6       ACTIVE CODE 599 IN CRUZ POWER MANAGEMENT
        7       ACTIVE CODE 670 QDM4 FAILURE


 63  ACTMLF06        ACTIVE MALFUNCTION FLAG WORD 6
        0       ACTIVE CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE
        1       ACTIVE CODE 406 LINEAR EGR PINTLE POSITION ERROR
        2       ACTIVE CODE 558 CRUISE VACUUM DEPLETION
        3       ACTIVE CODE 562 VAC MALFUNCTION
        4       ACTIVE CODE 561 VENT MALFUNCTION
        5       ACTIVE CODE 531 A/C LOW FREON
        6       ACTIVE CODE 626 VATS FAILURE
        7       ACTIVE CODE 257 BOOST CONTROL FAILURE (OVERBOOST)
 64  ACTMLF07        ACTIVE MALFUNCTION FLAG WORD 7
        0       ACTIVE CODE 274 INJECTORS WIRED INCORRECTLY
        1       ACTIVE CODE 573 LOSS OF SERIAL DATA ABS MSG 91
        2       ACTIVE CODE 530 A/C PRESSURE SWITCH FAILURE
        3       ACTIVE CODE 565 CRUZ SERVO POSITION SENSOR FAILURE
        4       ACTIVE CODE 568 CRUZ SYSTEM MALFUNCTION
        5       ACTIVE CODE 567 CRUZ SWITCH MALFUNCTION
        6       ACTIVE CODE NOT USED
        7       ACTIVE CODE 624 SOFTWARE RESET
 65  ACTMLF08        ACTIVE MALFUNCTION FLAG WORD 8
        0       ACTIVE CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       ACTIVE CODE 171 FUEL TRIM LEAN
        2       ACTIVE CODE 172 FUEL TRIM RICH
        3       ACTIVE CODE 300 MISFIRE DETECTED
        4       ACTIVE CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       ACTIVE CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       ACTIVE CODE 420 CATALYST MONITOR MALFUNCTION
        7       ACTIVE CODE 484 LINEAR EGR FEEDPIPE FAILURE
 66  BPWFDISP      BASE PULSE WIDTH (MSB)
 67  BPWFDISP+1    BASE PULSE WIDTH (LSB)
                     MSEC = N/65.536








..PAGE
..HEAD02L ALDL DATA LIST
..HEAD03L NUMBER OF DATA WORDS - 67
..HEAD04L ALDL MODE 1 DATA LIST MESSAGE 1
WORD DATA NAME     DESCRIPTION

 1   LASHLRN       LEARNED VALUE OF CABLE LASH FROM SERVO TO THROTTLE
                    %STROKE = N/2.56
 2   DCTRQREQ      TORQUE DUTY CYCLE REQUESTED BY TCS
                    %DC = N/2.56
 3   DCTRQDLV      ACTUAL TORQUE DUTY CYCLE DELIVERED
                    %DC = N/2.56
 4   ABSSTAT         ABS STATUS FLAGS
        0       NOT USED
        1       NOT USED
        2       NOT USED
        3       1 = TRACTION CONTROL ON VEHICLE
        4       1 = ABS INHIBITED
        5       1 = ABS ACTIVE
        6       1 = BRAKE LIMIT SWITCH NOT TRIPPED
        7       1 = BRAKE LIGHT SWITCH TRIPPED
 5   TURBNRPM      TURBINE RPM (MSB)
 6   TURBNRPM+1    TURBINE RPM (LSB)
                              RPM = N
 7   DEVDIFOL      DIFFERENCE BETWEEN AVE. DEVIATION AND DEVIATION THRESH.
                    N = COUNTS
 8   MISFMWSD        MISFIRE MODE WORD
        0       1 = CYLINDER 1 MISFIRING
        1       1 = CYLINDER 2 MISFIRING
        2       1 = CYLINDER 3 MISFIRING
        3       1 = CYLINDER 4 MISFIRING
        4       1 = CYLINDER 5 MISFIRING
        5       1 = CYLINDER 6 MISFIRING
        6       NOT USED
        7       NOT USED
 9   HSTMLF01        HISTORY MALFUNCTION FLAG WORD 1
        0       HISTORY CODE 123 THROTTLE POSITION HIGH
        1       HISTORY CODE 629 INVALID PASS KEY FREQUENCY
        2       HISTORY CODE 341 INTERMITTENT CAM SIGNAL
        3       HISTORY CODE 321 18X INTERRUPTS LOST
        4       HISTORY CODE 630 BATTERY VOLTAGE OUT OF RANGE
        5       HISTORY CODE 117 COOLANT SENSOR LOW
        6       HISTORY CODE 118 COOLANT SENSOR HIGH
        7       HISTORY CODE 134 ENGINE 02 SENSOR NOT ACTIVE
 10  HSTMLF02        HISTORY MALFUNCTION FLAG WORD 2
        0       HISTORY CODE 140 CATALYST 02 SENSOR NOT ACTIVE
        1       HISTORY CODE 137 CATALYST 02 SENSOR LOW
        2       HISTORY CODE 138 CATALYST 02 SENSOR HIGH
        3       HISTORY CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE
        4       HISTORY CODE 113 AIR TEMP SENSOR HIGH
        5       HISTORY CODE 502 VEHICLE SPEED SENSOR LOW
        6       HISTORY CODE 112 AIR TEMP SENSOR LOW
        7       HISTORY CODE 122 THROTTLE POSITION LOW
 11  HSTMLF03        HISTORY MALFUNCTION FLAG WORD 3
        0       HISTORY CODE 703 BRAKE SWITCH FAILURE
        1       HISTORY CODE 501 VEHICLE SPEED SENSOR FAILURE
        2       HISTORY CODE 755 F31 TRANSMISSION SOLENOID B FAILURE
        3       HISTORY CODE 361 EST LINE NOT TOGGLING
        4       HISTORY CODE 101 MASS AIR FLOW SENSOR FAILURE
        5       HISTORY CODE 619 OIL CHANGED INPUT FAULT
        6       HISTORY CODE 705 PRNDL SWITCH FAILURE
        7       HISTORY CODE 680 QDM5 FAILURE
 12  HSTMLF04        HISTORY MALFUNCTION FLAG WORD 4
        0       HISTORY CODE 640 QDM1 FAILURE
        1       HISTORY CODE 650 QDM2 FAILURE
        2       HISTORY CODE 132 ENGINE 02 SENSOR HIGH
        3       HISTORY CODE 131 ENGINE 02 SENSOR LOW
        4       HISTORY CODE 325 ESC FAILURE
        5       HISTORY CODE 350 EST FAILURE
        6       HISTORY CODE 342 CAM SENSOR FAILURE
        7       HISTORY CODE 740 TCC FAILURE
 13  HSTMLF05        HISTORY MALFUNCTION FLAG WORD 5
        0       HISTORY CODE 550 STEPPER MOTOR CRUZ PROBLEM
        1       HISTORY CODE 712 TRANSMISSION TEMP. SENSOR LOW
        2       HISTORY CODE 713 TRANSMISSION TEMP. SENSOR HIGH
        3       HISTORY CODE 625 HARDWARE RESET
        4       HISTORY CODE 660 QDM3 FAILURE
        5       HISTORY CODE 623 PROM ERROR
        6       HISTORY CODE 599 IN CRUZ POWER MANAGEMENT
        7       HISTORY CODE 670 QDM4 FAILURE
 14  HSTMLF06        HISTORY MALFUNCTION FLAG WORD 6
        0       HISTORY CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE
        1       HISTORY CODE 406 LINEAR EGR PINTLE POSITION ERROR
        2       HISTORY CODE 558 CRUISE VACUUM DEPLETION
        3       HISTORY CODE 562 VAC MALFUNTION
        4       HISTORY CODE 561 VENT MALFUNCTION
        5       HISTORY CODE 531 A/C LOW FREON
        6       HISTORY CODE 599 626 VATS FAILURE
        7       HISTORY CODE 670 257 BOOST CONTROL FAILURE (OVERBOOST)


 15  HSTMLF07        HISTORY MALFUNCTION FLAG WORD 7
        0       HISTORY CODE 274 INJECTORS WIRED INCORRECTLY
        1       HISTORY CODE 573 LOSS OF SERIAL DATA ABS MSG 91
        2       HISTORY CODE 530 A/C PRESSURE SWITCH FAILURE
        3       HISTORY CODE 565 CRUZ SERVO POSITION SENSOR FAILURE
        4       HISTORY CODE 568 CRUZ SYSTEM MALFUNCTION
        5       HISTORY CODE 567 CRUZ SWITCH MALFUNCTION
        6       HISTORY CODE NOT USED
        7       HISTORY CODE 624 SOFTWARE RESET
 16  HSTMLF08        HISTORY MALFUNCTION FLAG WORD 8
        0       HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       HISTORY CODE 171 FUEL TRIM LEAN
        2       HISTORY CODE 172 FUEL TRIM RICH
        3       HISTORY CODE 300 MISFIRE DETECTED
        4       HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       HISTORY CODE 420 CATALYST MONITOR MALFUNCTION
        7       HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE

 17  QLSTCY01        ACTIVE LAST CYCLE FLAG WORD 1
        0       ACTIVE CODE 123 THROTTLE POSITION HIGH
        1       ACTIVE CODE 629 INVALID PASS KEY FREQUENCY
        2       ACTIVE CODE 341 INTERMITTENT CAM SIGNAL
        3       ACTIVE CODE 321 18X INTERRUPTS LOST
        4       ACTIVE CODE 630 BATTERY VOLTAGE OUT OF RANGE
        5       ACTIVE CODE 117 COOLANT SENSOR LOW
        6       ACTIVE CODE 118 COOLANT SENSOR HIGH
        7       ACTIVE CODE 134 ENGINE 02 SENSOR NOT ACTIVE
 18  QLSTCY02        ACTIVE LAST CYCLE FLAG WORD 2
        0       ACTIVE CODE 140 CATALYST 02 SENSOR NOT ACTIVE
        1       ACTIVE CODE 137 CATALYST 02 SENSOR LOW
        2       ACTIVE CODE 138 CATALYST 02 SENSOR HIGH
        3       ACTIVE CODE 571 TRACTION CONTROL PWM INPUT OUT OF RANGE
        4       ACTIVE CODE 113 AIR TEMP SENSOR HIGH
        5       ACTIVE CODE 502 VEHICLE SPEED SENSOR LOW
        6       ACTIVE CODE 112 AIR TEMP SENSOR LOW
        7       ACTIVE CODE 122 THROTTLE POSITION LOW
 19  QLSTCY03        ACTIVE LAST CYCLE FLAG WORD 3
        0       ACTIVE CODE 703 BRAKE SWITCH FAILURE
        1       ACTIVE CODE 501 VEHICLE SPEED SENSOR FAILURE
        2       ACTIVE CODE 755 F31 TRANSMISSION SOLENOID B FAILURE
        3       ACTIVE CODE 361 EST LINE NOT TOGGLING
        4       ACTIVE CODE 101 MASS AIR FLOW SENSOR FAILURE
        5       ACTIVE CODE 619 OIL CHANGED INPUT FAULT
        6       ACTIVE CODE 705 PRNDL SWITCH FAILURE
        7       ACTIVE CODE 680 QDM5 FAILURE
 20  QLSTCY04        ACTIVE LAST CYCLE FLAG WORD 4
        0       ACTIVE CODE 640 QDM1 FAILURE
        1       ACTIVE CODE 650 QDM2 FAILURE
        2       ACTIVE CODE 132 ENGINE 02 SENSOR HIGH
        3       ACTIVE CODE 131 ENGINE 02 SENSOR LOW
        4       ACTIVE CODE 325 ESC FAILURE
        5       ACTIVE CODE 350 EST FAILURE
        6       ACTIVE CODE 342 CAM SENSOR FAILURE
        7       ACTIVE CODE 740 TCC FAILURE
 21  QLSTCY05        ACTIVE LAST CYCLE FLAG WORD 5
        0       ACTIVE CODE 550 STEPPER MOTOR CRUZ PROBLEM
        1       ACTIVE CODE 712 TRANSMISSION TEMP. SENSOR LOW
        2       ACTIVE CODE 713 TRANSMISSION TEMP. SENSOR HIGH
        3       ACTIVE CODE 625 HARDWARE RESET
        4       ACTIVE CODE 660 QDM3 FAILURE
        5       ACTIVE CODE 623 PROM ERROR
        6       ACTIVE CODE 599 IN CRUZ POWER MANAGEMENT
        7       ACTIVE CODE 670 QDM4 FAILURE
 22  QLSTCY06        ACTIVE LAST CYCLE FLAG WORD 6
        0       ACTIVE CODE 401 OBD1 DELTA RPM LINEAR EGR FLOW FAILURE
        1       ACTIVE CODE 406 LINEAR EGR PINTLE POSITION ERROR
        2       ACTIVE CODE 558 CRUISE VACUUM DEPLETION
        3       ACTIVE CODE 562 VAC MALFUNTION
        4       ACTIVE CODE 561 VENT MALFUNCTION
        5       ACTIVE CODE 531 A/C LOW FREON
        6       ACTIVE CODE 599 626 VATS FAILURE
        7       ACTIVE CODE 670 257 BOOST CONTROL FAILURE (OVERBOOST)
 23  QLSTCY07        ACTIVE LAST CYCLE FLAG WORD 7
        0       ACTIVE CODE 274 INJECTORS WIRED INCORRECTLY
        1       ACTIVE CODE 573 LOSS OF SERIAL DATA ABS MSG 91
        2       ACTIVE CODE 530 A/C PRESSURE SWITCH FAILURE
        3       ACTIVE CODE 565 CRUZ SERVO POSITION SENSOR FAILURE
        4       ACTIVE CODE 568 CRUZ SYSTEM MALFUNCTION
        5       ACTIVE CODE 567 CRUZ SWITCH MALFUNCTION
        6       ACTIVE CODE NOT USED
        7       ACTIVE CODE 624 SOFTWARE RESET


 24  QLSTCY08        ACTIVE LAST CYCLE FLAG WORD 8
        0       ACTIVE CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       ACTIVE CODE 171 FUEL TRIM LEAN
        2       ACTIVE CODE 172 FUEL TRIM RICH
        3       ACTIVE CODE 300 MISFIRE DETECTED
        4       ACTIVE CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       ACTIVE CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       ACTIVE CODE 420 CATALYST MONITOR MALFUNCTION
        7       ACTIVE CODE 484 LINEAR EGR FEEDPIPE FAILURE
 25  MFCYLAC1      MISFIRING CYLINDER (MSB)
 26  MFCYLAC1+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 27  MFCYLAC2      MISFIRING CYLINDER (MSB)
 28  MFCYLAC2+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 29  MFCYLAC3      MISFIRING CYLINDER (MSB)
 30  MFCYLAC3+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 31  MFCYLAC4      MISFIRING CYLINDER (MSB)
 32  MFCYLAC4+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 33  MFCYLAC5      MISFIRING CYLINDER (MSB)
 34  MFCYLAC5+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 35  MFCYLAC6      MISFIRING CYLINDER (MSB)
 36  MFCYLAC6+1    MISFIRING CYLINDER (LSB)
                    CYLINDER = N
 37  FALMFTAC      TOTAL FAILED MISFIRING TEST (MSB)
 38  FALMFTAC+1    TOTAL FAILED MISFIRING TEST (LSB)
                    TOTAL CYLS. = N/2
 39  PASMFTAC      TOTAL PASSED MISFIRING TEST (MSB)
 40  PASMFTAC+1    TOTAL PASSED MISFIRING TEST (LSB)
                    TOTAL CYLS. = N/2
 41  QERFINHI      HIGHEST (EWMA) RPM VALUE SINCE LAST RESET
                    RPM = N * 12.5
 42  QEMFINHI      HIGHEST (EWMA) MAP VALUE SINCE LAST RESET
                    MAP = (N * 5/255)
 43  TSTHSTMX      MAXIMUM NUMBER OF BITS SET IN MISFIRE HISTORY FLAGWORD
                    N = BITS
 44  QMILFG08        MIL ON REQUESTED
        0       HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       HISTORY CODE 171 FUEL TRIM LEAN
        2       HISTORY CODE 172 FUEL TRIM RICH
        3       HISTORY CODE 300 MISFIRE DETECTED
        4       HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       HISTORY CODE 420 CATALYST MONITOR MALFUNCTION
        7       HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE
 45  ACTKON08        ACTIVE SET THIS KEY-ON
        0       HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       HISTORY CODE 171 FUEL TRIM LEAN
        2       HISTORY CODE 172 FUEL TRIM RICH
        3       HISTORY CODE 300 MISFIRE DETECTED
        4       HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       HISTORY CODE 420 CATALYST MONITOR MALFUNCTION
        7       HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE
 46  QTPASS08        TEST PASS THIS KEY-ON
        0       HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       HISTORY CODE 171 FUEL TRIM LEAN
        2       HISTORY CODE 172 FUEL TRIM RICH
        3       HISTORY CODE 300 MISFIRE DETECTED
        4       HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       HISTORY CODE 420 CATALYST MONITOR MALFUNCTION
        7       HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE
 47  TRIPCT15        DIAGNOSTIC TRIP COUNTER 15
        0       MALF CODE 125 C/L MIN. COOLANT TEMP. TRIP COUNTER LOW BIT
        1       MALF CODE 125 C/L MIN. COOLANT TEMP. TRIP COUNTER HIGH BIT
        2       MALF CODE 171 FUEL TRIM LEAN, LOWER BIT
        3       MALF CODE 171 FUEL TRIM LEAN, HIGHER BIT
        4       MALF CODE 172 FUEL TRIM RICH, LOWER BIT
        5       MALF CODE 172 FUEL TRIM RICH, HIGHER BIT
        6       MALF CODE 300 MISFIRE DETECTED, LOW BIT
        7       MALF CODE 300 MISFIRE DETECTED, HIGHER BIT
 48  TRIPCT16        DIAGNOSTIC TRIP COUNTER 16
        0       MALF CODE 400 LINEAR EGR FLOW TRIP COUNTER, LOWER BIT
        1       MALF CODE 400 LINEAR EGR FLOW TRIP COUNTER, HIGHER BIT
        2       MALF CODE OBD2 DELTA MAP LEGR FLOW FAILURE
        3       MALF CODE OBD2 DELTA MAP LEGR FLOW FAILURE
        4       MALF CODE 420 CATALYST MONITOR MALFUNCTION
        5       MALF CODE 420 CATALYST MONITOR MALFUNCTION
        6       MALF CODE 484 LINEAR EGR FEEDPIPE FAILURE LOW BIT
        7       MALF CODE 484 LINEAR EGR FEEDPIPE FAILURE HIGH BIT


 49  QIMRDY08        I/M READINESS FLAGWORD
        0       HISTORY CODE 125 CLOSED LOOP MIN. COOLANT TEMP. NOT MET IN TIME
        1       HISTORY CODE 171 FUEL TRIM LEAN
        2       HISTORY CODE 172 FUEL TRIM RICH
        3       HISTORY CODE 300 MISFIRE DETECTED
        4       HISTORY CODE 400 OBD2 DELTA RPM LINEAR EGR FLOW FAILURE
        5       HISTORY CODE 503 OBD2 DELTA MAP LINEAR EGR FLOW FAILURE
        6       HISTORY CODE 420 CATALYST MONITOR MALFUNCTION
        7       HISTORY CODE 484 LINEAR EGR FEEDPIPE FAILURE
 50  QDGCFTB       CAPTURED FAILURE DATA BUFFER
                    N = COUNTS
 51  QERVERSET     INDICATES IF ACTMLF08 MALFS. WERE EVER SET
                    N = COUNTS
 52  MAXV2X1       LARGEST POSITIVE DELTA REF. FOR 2ND MOST RECENT CYCLE (MSB)
 53  MAXV2X1+1     LARGEST POSITIVE DELTA REF. FOR 2ND MOST RECENT CYCLE (LSB)
                    DELTA = N
 54  QCATPASS      NUMBER OF CATALYST MONITOR PASSES (MSB)
 55  QCATPASS+1    NUMBER OF CATALYST MONITOR PASSES (LSB)
                    N = NUMBERS
 56  QCATFAIL      NUMBER OF CATALYST MONITOR FAILURES (MSB)
 57  QCATFAIL+1    NUMBER OF CATALYST MONITOR FAILURES (LSB)
                    N = NUMBERS
 58  QERPMDIF      RPM DIFFERENTIAL
 59  QEMAPDIF      MAP DIFFERENTIAL
 60  QERPMPAS      NUMBER OF DELTA RPM EGR TEST PASSES (MSB)
 61  QERPMPAS+1    NUMBER OF DELTA RPM EGR TEST PASSES (LSB)
                    N = NUMBERS
 62  QERPMFAL      NUMBER OF DELTA RPM EGR TEST FAILURES (MSB)
 63  QERPMFAL+1    NUMBER OF DELTA RPM EGR TEST FAILURES (LSB)
                    N = NUMBERS
 64  QEMAPPAS      NUMBER OF DELTA MAP EGR TEST PASSES (MSB)
 65  QEMAPPAS+1    NUMBER OF DELTA MAP EGR TEST PASSES (LSB)
                    N = NUMBERS
 66  QEMAPFAL      NUMBER OF DELTA MAP EGR TEST FAILURES (MSB)
 67  QEMAPFAL+1    NUMBER OF DELTA MAP EGR TEST FAILURES (LSB)
















;����������������������������������������������������������������������������Ŀ
;�                                                                            �
;�                              MANIFOLD AIR TEMP                             �
;�                               (LOOK-UP TABLE)                              �
;�    ********************************************************************    �
;������������������������������������������������������������������������������


                    *     A/D             DEG C         DEG F
                          ---             -----         -----
                          0               -40.0         -40.0
                          1               -39.0         -38.2
                          2               -38.0         -36.5
                          3               -37.0         -34.7
                          4               -36.1         -32.9
                          5               -35.1         -31.1
                          6               -34.1         -29.4
                          7               -33.1         -27.6
                          8               -32.1         -25.8
                          9               -31.1         -24.1
                          10               -30.2         -22.3
                          11               -29.2         -20.5
                          12               -28.2         -18.7
                          13               -27.2         -17.0
                          14               -26.2         -15.2
                          15               -25.2         -13.4
                          16               -24.3         -11.6
                          17               -23.5         -10.2
                          18               -22.7         -8.8
                          19               -21.9         -7.3
                          20               -21.1         -5.9
                          21               -20.3         -4.5
                          22               -19.5         -3.0
                          23               -18.7         -1.6
                          24               -17.9         -0.2
                          25               -17.1         1.3
                          26               -16.3         2.7
                          27               -15.5         4.1
                          28               -14.7         5.6
                          29               -13.9         7.0
                          30               -13.1         8.4
                          31               -12.3         9.9
                          32               -11.5         11.3
                          33               -10.9         12.3
                          34               -10.4         13.3
                          35               -9.8          14.3
                          36               -9.3          15.4
                          37               -8.7          16.4
                          38               -8.1          17.4
                          39               -7.6          18.4
                          40               -7.0          19.4
                          41               -6.4          20.4
                          42               -5.9          21.4
                          43               -5.3          22.4
                          44               -4.8          23.5
                          45               -4.2          24.5
                          46               -3.6          25.5
                          47               -3.1          26.5
                          48               -2.5          27.5
                          49               -2.1          28.3
                          50               -1.7          29.0
                          51               -1.2          29.8
                          52               -0.8          30.5
                          53               -0.4          31.3
                          54               0.0           32.1
                          55               0.5           32.8
                          56               0.9           33.6
                          57               1.3           34.3
                          58               1.7           35.1
                          59               2.1           35.9
                          60               2.6           36.6
                          61               3.0           37.4
                          62               3.4           38.1
                          63               3.8           38.9
                          64               4.3           39.7
                          65               4.7           40.4
                          66               5.1           41.2
                          67               5.5           41.9
                          68               5.9           42.7
                          69               6.4           43.4
                          70               6.8           44.2
                          71               7.2           45.0
                          72               7.6           45.7
                          73               8.0           46.5
                          74               8.5           47.2
                          75               8.9           48.0
                          76               9.3           48.8
                          77               9.7           49.5
                          78               10.2          50.3
                          79               10.6          51.0
                          80               11.0          51.8
                          81               11.3          52.4
                          82               11.7          53.0
                          83               12.0          53.6
                          84               12.3          54.2
                          85               12.6          54.8
                          86               13.0          55.3
                          87               13.3          55.9
                          88               13.6          56.5
                          89               14.0          57.1
                          90               14.3          57.7
                          91               14.6          58.3
                          92               14.9          58.9
                          93               15.3          59.5
                          94               15.6          60.1
                          95               15.9          60.7
                          96               16.3          61.3
                          97               16.6          61.9
                          98               17.0          62.6
                          99               17.4          63.3
                          100               17.8          64.0
                          101               18.1          64.6
                          102               18.5          65.3
                          103               18.9          66.0
                          104               19.3          66.7
                          105               19.6          67.3
                          106               20.0          68.0
                          107               20.4          68.7
                          108               20.8          69.3
                          109               21.1          70.0
                          110               21.5          70.7
                          111               21.9          71.4
                          112               22.3          72.1
                          113               22.6          72.6
                          114               22.9          73.2
                          115               23.2          73.8
                          116               23.6          74.4
                          117               23.9          75.0
                          118               24.2          75.6
                          119               24.5          76.2
                          120               24.9          76.8
                          121               25.2          77.4
                          122               25.5          78.0
                          123               25.9          78.5
                          124               26.2          79.1
                          125               26.5          79.7
                          126               26.8          80.3
                          127               27.2          80.9
                          128               27.5          81.5
                          129               27.9          82.2
                          130               28.3          82.8
                          131               28.6          83.5
                          132               29.0          84.2
                          133               29.4          84.9
                          134               29.8          85.6
                          135               30.1          86.2
                          136               30.5          86.9
                          137               30.9          87.6
                          138               31.3          88.3
                          139               31.6          88.9
                          140               32.0          89.6
                          141               32.4          90.3
                          142               32.8          90.9
                          143               33.1          91.6
                          144               33.5          92.3
                          145               33.9          93.0
                          146               34.3          93.7
                          147               34.6          94.3
                          148               35.0          95.0
                          149               35.4          95.7
                          150               35.8          96.3
                          151               36.1          97.0
                          152               36.5          97.7
                          153               36.9          98.4
                          154               37.3          99.1
                          155               37.6          99.7
                          156               38.0          100.4
                          157               38.4          101.1
                          158               38.8          101.8
                          159               39.1          102.4
                          160               39.5          103.1
                          161               39.9          103.9
                          162               40.3          104.6
                          163               40.8          105.4
                          164               41.2          106.1
                          165               41.6          106.9
                          166               42.0          107.7
                          167               42.5          108.4
                          168               42.9          109.2
                          169               43.3          109.9
                          170               43.7          110.7
                          171               44.1          111.5
                          172               44.6          112.2
                          173               45.0          113.0
                          174               45.4          113.7
                          175               45.8          114.5
                          176               46.3          115.3
                          177               46.8          116.2
                          178               47.3          117.1
                          179               47.8          118.0
                          180               48.3          119.0
                          181               48.8          119.9
                          182               49.3          120.8
                          183               49.9          121.7
                          184               50.4          122.7
                          185               50.9          123.6
                          186               51.4          124.5
                          187               51.9          125.5
                          188               52.4          126.4
                          189               53.0          127.3
                          190               53.5          128.2
                          191               54.0          129.2
                          192               54.5          130.1
                          193               55.1          131.2
                          194               55.7          132.3
                          195               56.3          133.4
                          196               56.9          134.5
                          197               57.5          135.6
                          198               58.2          136.7
                          199               58.8          137.8
                          200               59.4          138.9
                          201               60.0          140.0
                          202               60.6          141.1
                          203               61.2          142.2
                          204               61.8          143.3
                          205               62.4          144.4
                          206               63.0          145.5
                          207               63.6          146.6
                          208               64.3          147.6
                          209               65.1          149.2
                          210               65.9          150.7
                          211               66.8          152.2
                          212               67.6          153.7
                          213               68.5          155.2
                          214               69.3          156.8
                          215               70.2          158.3
                          216               71.0          159.8
                          217               71.8          161.3
                          218               72.7          162.8
                          219               73.5          164.4
                          220               74.4          165.9
                          221               75.2          167.4
                          222               76.1          168.9
                          223               76.9          170.4
                          224               77.8          171.9
                          225               79.3          174.7
                          226               80.8          177.5
                          227               82.4          180.3
                          228               83.9          183.1
                          229               85.5          185.9
                          230               87.0          188.7
                          231               88.6          191.4
                          232               90.1          194.2
                          233               91.7          197.0
                          234               93.2          199.8
                          235               94.8          202.6
                          236               96.3          205.4
                          237               97.9          208.1
                          238               99.4          210.9
                          239               101.0         213.7
                          240               102.5         216.5
                          241               105.5         222.0
                          242               108.6         227.5
                          243               111.6         233.0
                          244               114.7         238.4
                          245               117.7         243.9
                          246               120.8         249.4
                          247               123.8         254.9
                          248               126.9         260.4
                          249               129.9         265.9
                          250               133.0         271.3
                          251               136.0         276.8
                          252               139.1         282.3
                          253               142.1         287.8
                          254               145.2         293.3
                          255               148.2         298.8



*/