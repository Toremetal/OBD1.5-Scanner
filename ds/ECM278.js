/** **========= [ Class ECM278 ] =========**|
 **  ECM Class for data stream A278 (& A258).
 **    JavaScript ECM Serial Data Decoder
 **     for 95 3.4L SFI-66U (L32) VIN: S
 ** A278: F-CAR WITH ELECTRONIC TRANS (4L60E)
 **   A258: F-CAR WITH MANUAL TRANSMISSION
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
class ECM278 {
    
    constructor() {

        /** State Properties
        *  Note: Internal use must be accessed through object reference,
        *   using keyword *this. inside the functions does not work. */
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
         * * A278-Automatic [true],
         * * A258-Manual [false]. */
        this.A_TRANSMISSION = false;

        this.vinDataLength = 48;
        this.engDataLength = 70;
        this.milDataLength = 24;
        
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
        
        /** DATA-REQUEST Response validation. */
        this.EcmCmdDisConnectDataStream = {
            /* ----Mode [0] Response */
            id: 0xE4,
            messageLength: 0x56,
            mode: 0x00
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdStopComDataStream = {
            /* ----Mode [8] Response */
            id: 0xE4,
            messageLength: 0x56,
            mode: 0x08
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdMilDataStream = {
            /* ----Mode [1] Message(2) Response */
            id: 0xE4,
            messageLength: 0x6B,
            mode: 0x01
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdVinDataStream = {
            /* ----Mode [1] Message(4) Response */
            id: 0xE4,
            messageLength: 0x83,
            mode: 0x01
        };

        /** DATA-REQUEST Response validation. */
        this.EcmCmdEngineDataStream = {
            /* ----Mode [1] Message(0) Response */
            id: 0xE4,
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
/*0*/ engineDataCmd: new Uint8Array([0xE4, 0x57, 0x01, 0x00, 0xC4]),
/*1*/  milDataCmd: new Uint8Array([0xE4, 0x57, 0x01, 0x02, 0xC2]),
/*2*/  vinDataCmd: new Uint8Array([0xE4, 0x57, 0x01, 0x04, 0xC0]),
/*3*/  stopComCmd: new Uint8Array([0xE4, 0x56, 0x08, 0xBE]),
/*4*/     msg1: new Uint8Array([0xE4, 0x57, 0x07, 0x05, 0xB9]),
/*5*/     msg2: new Uint8Array([0xE4, 0x57, 0x07, 0x0A, 0xB4]),
/*6*/     msg3: new Uint8Array([0xE4, 0x57, 0x07, 0xF0, 0xCE]),
/*7*/ disconnectEcmCmd: new Uint8Array([0xE4, 0x56, 0x00, 0xC6]),
/*8*/ resetMilCmd: new Uint8Array([0xE4, 0x56, 0x0A, 0xBC]),
/*9*/    reset: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB6]),
/*10*/   fanon: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB6]),
/*11*/  fanoff: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36]),
/*12*/   milon: new Uint8Array([0xE4, 0x62, 0x04, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB2]),
/*13*/  miloff: new Uint8Array([0xE4, 0x62, 0x04, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB4]),
/*14*/  evapon: new Uint8Array([0xE4, 0x62, 0x04, 0x10, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x96]),
/*15*/ evapoff: new Uint8Array([0xE4, 0x62, 0x04, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA6]),
/*16*/    acon: new Uint8Array([0xE4, 0x62, 0x04, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB4]),
/*17*/   acoff: new Uint8Array([0xE4, 0x62, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB5]),
/*18*/  egr1on: new Uint8Array([0xE4, 0x62, 0x04, 0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB6]),
/*19*/ egr1off: new Uint8Array([0xE4, 0x62, 0x04, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36]),
/*20*/  egr2on: new Uint8Array([0xE4, 0x62, 0x04, 0x40, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36]),
/*21*/ egr2off: new Uint8Array([0xE4, 0x62, 0x04, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x76]),
/*22*/  egr3on: new Uint8Array([0xE4, 0x62, 0x04, 0x20, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x76]),
/*23*/ egr3off: new Uint8Array([0xE4, 0x62, 0x04, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x96]),
/*24*/   idle6: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x30, 0x00, 0x00, 0x56]),
/*25*/   idle8: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x40, 0x00, 0x00, 0x46]),
/*26*/  idle10: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x50, 0x00, 0x00, 0x36]),
/*27*/  idle12: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x60, 0x00, 0x00, 0x26]),
/*28*/ResetBLM: new Uint8Array([0xE4, 0x62, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB6]),
/*29*/  reset2: new Uint8Array([0xF9, 0x5B, 0x04, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x08]),
/*30*/noCmdNum: new Uint8Array([0]),
/*31*/ vinTest: new Uint8Array([0xE4,0x83,0x01,0x32,0x47,0x31,0x46,0x50,0x32,0x32,0x53,0x37,0x53,0x32,0x31,0x38,0x39,0x36,0x32,0x37,0x00,0xF7,0x74,0x0D,0x31,0x36,0x30,0x30,0x33,0x31,0x31,0x30,0x39,0x36,0x37,0x35,0x30,0x37,0x34,0x02,0x00,0xF7,0x74,0x3F,0x00,0xF7,0x74,0x40,0xD3]),
/*32*/ engTest: new Uint8Array([0xE4,0x99,0x01,0x00,0x00,0x7C,0x77,0x66,0xFE,0xFE,0x1C,0x00,0x01,0x00,0x00,0xFF,0xFF,0x04,0x00,0x00,0x00,0x00,0x50,0x0B,0xD0,0x80,0x80,0x66,0x80,0x80,0x66,0x43,0x04,0x00,0xFF,0x00,0x24,0x00,0xC2,0xC0,0x48,0x00,0x00,0x00,0x61,0x27,0xF7,0x02,0x00,0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x80,0x00,0x08,0x00,0xD7]),
/*33*/ milTest: new Uint8Array([0xE4,0x6B,0x01,0x03,0x00,0x00,0x21,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x8C])
        };

        this.CMDNAMES = Object.keys(this.EcmCmds);

        /** UI Elements to Assign Values. 
        * options: -volts,-msb,-lsb,-tempf,-deg,-blm,-int,-rpm,-cell,-percent,-psi
        */
        this.ENGINE_DATA = {
            byte1: "engine-runtime-msb",
            byte2: "engine-runtime-lsb",
            byte3: "coolant-temp-tempf",
            byte4: "battery", /* element "battery" required by the UI. */
            byte5: "intake-air-temp-tempf",
            byte6: "map-sensor-volts",
            byte7: "baro-pressure-volts",
            byte8: "tps-volts",
            byte9: "tps-percent",
            byte10: "trans-temp", /* element "trans-temp" required by the UI. */
            byte11: "mph", /* element "mph" required by the UI. */
            byte12: "target-idle-rpm",
            byte13: "NotUsed",
            byte14: "rpm24x-rpm",
            byte15: "gear", /* element "gear" required by the UI. */
            byte16: "knock-count",
            byte17: "knock-retard-deg",
            byte18: "NotUsed",// "EGR STATUS",
            byte19: "blm-cell", /* element "blm-cell" required by the UI. */
            byte20: "airfuel", /* element "airfuel" required by the UI. */
            byte21: "NotUsed",
            byte22: "base-inj-p/w-mseconds",
            byte23: "st-ft-bank-R-int",
            byte24: "lt-ft-bank-R-blm",
            byte25: "o2-bank-R-volts",
            byte26: "st-ft-bank-L-int",
            byte27: "lt-ft-bank-L-blm",
            byte28: "o2-bank-L-volts",
            byte29: "iac-pos",
            byte30: "min-iac-pos",
            byte31: "fuel-pump-volts",
            byte32: "ac-evap-sensor-tempf",
            byte33: "NotUsed",
            byte34: "spark-advance-deg",
            byte35: "evap-duty-cylcle-percent",
            byte36: "NotUsed",// "SPI-INPUT-DISCRETES-STATUS-REGISTER-3",
            byte37: "NotUsed",// "ALDL-STATUS",
            byte38: "NotUsed",// "fanOnOff", /* element "fanOnOff" created in the UI. */
            byte39: "NotUsed",
            byte40: "rpm", /* element "rpm" required by the UI. */
            byte41: "ac-transducer-psi",
            byte42: "NotUsed",// "A-C STATUS",
            byte43: "NotUsed",// "brakepressed", // TCC BRAKE
            byte44: "NotUsed",// "INJECTOR FAULT",
            byte45: "milcodes", /* element "milcodes" required by the UI. */
            byte46: "NotUsed",// "TCC DUTY CYCLE",
            byte47: "NotUsed",// "ForcedMotorDutyCycle",
            byte48: "NotUsed",// "DownshiftSolenoid",
            byte49: "NotUsed",// "TCC SLIPPAGE MSB",
            byte50: "NotUsed",// "TCC SLIPPAGE LSB",
            byte51: "NotUsed",// "OUTPUT SHAFT SPEED MSB",
            byte52: "NotUsed",// "OUTPUT SHAFT SPEED LSB",
            byte53: "NotUsed",// "INPUT SHAFT SPEED MSB",
            byte54: "NotUsed",// "INPUT SHAFT SPEED LSB",
            byte55: "NotUsed",// "COMMANDED PRESSURE",
            byte56: "NotUsed",// "FORCE MOTOR COMMAND CURRENT",
            byte57: "NotUsed",// "FORCE MOTOR ACTUAL CURRENT",
            byte58: "NotUsed",// "CURRENT ADAPTIVE MODIFIER",
            byte59: "NotUsed",// "CURRENT ADAPTIVE CELL",
            byte60: "NotUsed",// "1->2 SHIFT ERROR",
            byte61: "NotUsed",// "2->3 SHIFT ERROR",
            byte62: "NotUsed",// "1->2 SHIFT TIME",
            byte63: "NotUsed",// "2->3 SHIFT TIME",
            byte64: "NotUsed",// "TRANS SHIFT ADAPT STATUS",
            byte65: "NotUsed",// "TRANS ADAPTIVE SHIFT CONDITION VIOLATIONS",
            byte66: "NotUsed",// "TCC STATUS",
            byte67: "NotUsed",// "TCC STATUS CONT",
            length: 67
        };
        
        /** Diagnostic Trouble Codes / Malfunction Indicator Light.
         ** DTCCODES[(code + Byte# + bit#) as String]: returns value. */
        this.DTCCODES = {
            code20: "",
            code21: "",
            code22: "",
            code23: "",
            code24: "MALF CODE 98  INVALID PCM PROGRAM",
            code25: "MALF CODE 75  EGR1 SOLENOID ERROR",
            code26: "MALF CODE 76  EGR2 SOLENOID ERROR",
            code27: "MALF CODE 77  EGR3 SOLENOID ERROR",
            code30: "MALF CODE 36  IC 24X SIGNAL ERROR",
            code31: "MALF CODE 41  IC EST ERROR",
            code32: "MALF CODE 42  IC EST BYPASS ERROR",
            code33: "MALF CODE 14  ENGINE COOLANT TEMP. HIGH",
            code34: "MALF CODE 15  ENGINE COOLANT TEMP. LOW",
            code35: "MALF CODE 33  MAP SENSOR HIGH",
            code36: "MALF CODE 34  MAP SENSOR LOW",
            code37: "MALF CODE 51  PROM ERROR",
            code40: "MALF CODE 63  RIGHT O2 SENSOR ERROR",
            code41: "MALF CODE 46  PASSKEY II ERROR",
            code42: "MALF CODE 13  LEFT O2 SENSOR ERROR",
            code43: "",
            code44: "MALF CODE 64  RIGHT O2 SENSOR LEAN",
            code45: "MALF CODE 44  LEFT O2 SENSOR LEAN",
            code46: "MALF CODE 65  RIGHT O2 SENSOR RICH",
            code47: "MALF CODE 45  LEFT O2 SENSOR RICH",
            code50: "MALF CODE 35  IDLE SPEED ERROR",
            code51: "MALF CODE 43  KS CIRCUIT ERROR",
            code52: "MALF CODE 53  SYS. VOLTS HIGH",
            code53: "MALF CODE 16  SYS. VOLTS LOW",
            code54: "MALF CODE 25  IAT HIGH",
            code55: "MALF CODE 23  IAT LOW",
            code56: "MALF CODE 21  TPS VOLTAGE HIGH",
            code57: "MALF CODE 22  TPS VOLTAGE LOW",
            code60: "MALF CODE 66  A/C PRESSURE SENSOR LOW",
            code61: "MALF CODE 70  A/C PRESSURE SENSOR HIGH",
            code62: "MALF CODE 68  A/C RELAY SHORTED",
            code63: "MALF CODE 69  A/C RELAY OPEN",
            code64: "MALF CODE 67  A/C PRESS SENS ERR",
            code65: "MALF CODE 71  A/C EVAP TEMP LOW",
            code66: "MALF CODE 73  A/C EVAP TEMP HIGH",
            code67: "",
            code70: "",
            code71: "",
            code72: "MALF CODE 24  VSS CKT. NO SIGNAL",
            code73: "",
            code74: "MALF CODE 58  TFT SENSOR CKT. HIGH (LOW TEMP.)",
            code75: "MALF CODE 59  TFT SENSOR CKT. LOW (HIGH TEMP.)",
            code76: "MALF CODE 28  TR PRESSURE SWITCH CKT.",
            code77: "MALF CODE 72  VSS CKT. SIGNAL ERROR",
            code80: "MALF CODE 17  CAM SENSOR ERROR",
            code81: "MALF CODE 37  TCC BRAKE SWITCH ERROR",
            code82: "",
            code83: "",
            code84: "",
            code85: "",
            code86: "",
            code87: "",
            code90: "",
            code91: "MALF CODE 96 TRANS. SYSTEM VOLTAGE LOW",
            code92: "MALF CODE 82 IC 3X SIGNAL ERROR",
            code93: "MALF CODE 61 A/C LOW REFRIGERANT",
            code94: "MALF CODE 93 PCS CIRCUIT (CURRENT ERROR)",
            code95: "MALF CODE 79  TRANS. FLUID OVERTEMP.",
            code96: "MALF CODE 80  TRANS. COMPONENT ERROR",
            code97: "MALF CODE 90  TCC ERROR",
            code100: "",
            code101: "",
            code102: "",
            code103: "",
            code104: "",
            code105: "MALF CODE 99  INVALID PCM PROGRAM",
            code106: "MALF CODE 54  FUEL PUMP VOLTAGE LOW",
            code107: "MALF CODE 85  PROM ERROR",
            code110: "",
            code111: "MALF CODE 87  EEPROM ERROR",
            code112: "MALF CODE 86  A/D ERROR",
            code113: "",
            code114: "",
            code115: "",
            code116: "",
            code117: "",
            code120: "",
            code121: "",
            code122: "",
            code123: "",
            code124: "MALF CODE 98  INVALID PCM PROGRAM",
            code125: "MALF CODE 75  EGR1 SOLENOID ERROR",
            code126: "MALF CODE 76  EGR2 SOLENOID ERROR",
            code127: "MALF CODE 77  EGR3 SOLENOID ERROR",
            code130: "MALF CODE 13  LEFT O2 SENSOR ERROR",
            code131: "MALF CODE 41  IC EST ERROR",
            code132: "MALF CODE 42  IC EST BYPASS ERROR",
            code133: "MALF CODE 14  ENGINE COOLANT TEMP. HIGH",
            code134: "MALF CODE 15  ENGINE COOLANT TEMP. LOW",
            code135: "MALF CODE 33  MAP SENSOR HIGH",
            code136: "MALF CODE 34  MAP SENSOR LOW",
            code137: "MALF CODE 51  PROM ERROR",
            code140: "MALF CODE 63  RIGHT O2 SENSOR ERROR",
            code141: "MALF CODE 46  PASSKEY II ERROR",
            code142: "MALF CODE 13  LEFT O2 SENSOR ERROR",
            code143: "",
            code144: "MALF CODE 64  RIGHT O2 SENSOR LEAN",
            code145: "MALF CODE 44  LEFT O2 SENSOR LEAN",
            code146: "MALF CODE 65  RIGHT O2 SENSOR RICH",
            code147: "MALF CODE 45  LEFT O2 SENSOR RICH",
            code150: "MALF CODE 35  IDLE SPEED ERROR",
            code151: "MALF CODE 43  KS CIRCUIT",
            code152: "MALF CODE 53  SYS. VOLTS HIGH",
            code153: "MALF CODE 16  SYS. VOLTS LOW",
            code154: "MALF CODE 25  IAT HIGH",
            code155: "MALF CODE 23  IAT LOW",
            code156: "MALF CODE 21  TPS VOLTAGE HIGH",
            code157: "MALF CODE 22  TPS VOLTAGE LOW",
            code160: "MALF CODE 66  A/C PRESSURE SENSOR LOW",
            code161: "MALF CODE 70  A/C PRESSURE SENSOR HIGH",
            code162: "MALF CODE 68  A/C RELAY SHORTED",
            code163: "MALF CODE 69  A/C RELAY OPEN",
            code164: "MALF CODE 67  A/C PRESS SENS ERR",
            code165: "MALF CODE 71  A/C EVAP TEMP LOW",
            code166: "MALF CODE 73  A/C EVAP TEMP HIGH",
            code167: "",
            code170: "",
            code171: "",
            code172: "MALF CODE 24  VSS CKT. NO SIGNAL",
            code173: "",
            code174: "MALF CODE 58  TFT SENSOR CKT. LOW (HIGH TEMP.)",
            code175: "MALF CODE 59  TFT SENSOR CKT. HIGH (LOW TEMP.)",
            code176: "MALF CODE 28  TR PRESSURE SWITCH CKT.",
            code177: "MALF CODE 72  VSS CKT. SIGNAL ERROR",
            code180: "MALF CODE 17  CAM SENSOR ERROR",
            code181: "MALF CODE 37  TCC BRAKE SWITCH ERROR",
            code182: "",
            code183: "",
            code184: "",
            code185: "",
            code186: "",
            code187: "",
            code190: "",
            code191: "MALF CODE 96 TRANS. SYSTEM VOLTAGE LOW",
            code192: "MALF CODE 82 IC 3X SIGNAL ERROR",
            code193: "MALF CODE 61 A/C LOW REFRIGERANT",
            code194: "MALF CODE 93 PCS CIRCUIT (CURRENT ERROR)",
            code195: "MALF CODE 79  TRANS. FLUID OVERTEMP.",
            code196: "MALF CODE 80  TRANS. COMPONENT ERROR",
            code197: "MALF CODE 90  TCC ERROR",
            code200: "",
            code201: "",
            code202: "",
            code203: "",
            code204: "",
            code205: "MALF CODE 99  INVALID PCM PROGRAM",
            code206: "MALF CODE 54  FUEL PUMP VOLS. LOW",
            code207: "MALF CODE 85  PROM ERROR",
            code210: "",
            code211: "MALF CODE 87  EEPROM ERROR",
            code212: "MALF CODE 86  A/D ERROR",
            code213: "",
            code214: "",
            code215: "",
            code216: "",
            code217: ""
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
    
    toString() {
        return `
MODULE: ECM-A278 (A258) VIN: S
MODEL: 94-95 F-CAR 3.4L SFI-66U (L32)
TRANSMISSION: ELECTRONIC TRANS (4L60E)
(MODULE: A258) MANUAL TRANSMISSION`;
    }
    
    /* If True, Skip and hide VIN DATA. ECM DS Doesn't say it's provided. */
    hasNoVinData() {return false;}
    
    getVIN(vin) {
        if (vin.length >= 21) {//49
            let vinData = vin.slice(3, 21);
            let vinStr = "";
            for (let c in vinData) {
                vinStr += String.fromCharCode(vinData[c]);
            }
            return vinStr;
        } else if (vin.length == 18) {
            let vinStr = "";
            for (let c in vin) {
                vinStr += String.fromCharCode(vin[c]);
            }
            return vinStr;
        } else {return "ERROR";}
    }

    getMIL(value, ecmValues) {
        let dtcStr = "";
        for (let k = 0; k <= 20; k++) {
            if (k == 0) {
                ecmValues.activeDTC = value[k];
            } else if (value[k] != 0) {
                let n = parseInt(value[k]).toString(2);
                while (n.length != 8) {
                    n = "0" + n;
                }
                let dtcCode = n;
                let tc = 7;
                for (let t in dtcCode) {
                    if (dtcCode[t] == "1") {
                        let MilCode = this.DTCCODES["code" + (k + 1).toString() + tc.toString()];
                        if (MilCode != "") { dtcStr += MilCode + "<br/>"; }
                    }
                    tc--;
                }
            }
        }
        return dtcStr;
    }
    
    /** functions for ECM.processEngData[index](value); */
    byte1(v, ecmValues) {ecmValues.engStr = ""; ecmValues.tranStr = ""; return v;}
    byte2(v, ecmValues) {return v;}
    byte3(v, ecmValues) {return (1.35 * parseInt(v) - 40).toFixed();}
    byte4(v, ecmValues) {return (parseInt(v) / 10).toFixed(1);}
    byte5(v, ecmValues) {
        const ManifoldAirTempF = [-31.2, -30.5, -29.9, -29.2, -25.8, -22.5, -19.1, -15.7, -12.3, -8.9, -5.6, -2.2, 1.2, 4.6, 7.9, 11.3, 14.7, 18.0, 21.4, 24.8, 26.2, 27.7, 29.1, 30.5, 32.0, 33.4, 34.8, 36.3, 37.7, 39.1, 40.6, 42.0, 43.4, 44.9, 46.3, 47.8, 48.8, 49.8, 50.8, 51.8, 52.8, 53.8, 54.8, 55.8, 56.9, 57.9, 58.9, 59.9, 60.9, 61.9, 62.9, 64.0, 64.8, 65.6, 66.5, 67.3, 68.2, 69.0, 69.9, 70.7, 71.5, 72.4, 73.2, 74.1, 74.9, 75.8, 76.6, 77.4, 78.2, 79.0, 79.7, 80.5, 81.2, 82.0, 82.8, 83.5, 84.3, 85.0, 85.8, 86.6, 87.3, 88.1, 88.8, 89.6, 90.4, 91.1, 91.9, 92.6, 93.4, 94.2, 94.9, 95.7, 96.4, 97.2, 98.0, 98.7, 99.5, 100.2, 101.0, 101.8, 102.4, 103.1, 103.8, 104.4, 105.1, 105.8, 106.5, 107.2, 107.8, 108.5, 109.2, 109.8, 110.5, 111.2, 111.9, 112.6, 113.2, 113.9, 114.6, 115.3, 115.9, 116.6, 117.3, 117.9, 118.6, 119.3, 120.0, 120.7, 121.3, 122.0, 122.7, 123.3, 124.1, 124.9, 125.6, 126.4, 127.1, 127.9, 128.7, 129.4, 130.2, 130.9, 131.7, 132.5, 133.2, 134.0, 134.7, 135.5, 136.3, 137.2, 138.0, 138.9, 139.7, 140.6, 141.4, 142.3, 143.1, 143.9, 144.8, 145.6, 146.5, 147.3, 148.2, 149.0, 149.9, 150.9, 151.8, 152.7, 153.6, 154.6, 155.5, 156.4, 157.4, 158.3, 159.2, 160.1, 161.1, 162.0, 162.9, 163.9, 164.9, 165.9, 166.9, 167.9, 168.9, 169.9, 170.9, 171.9, 173.0, 174.0, 175.0, 176.0, 177.0, 178.0, 179.0, 180.1, 181.5, 182.9, 184.4, 185.8, 187.2, 188.7, 190.1, 191.5, 193.0, 194.4, 195.8, 197.3, 198.7, 200.1, 201.6, 203.0, 204.9, 206.9, 208.8, 210.8, 212.7, 214.6, 216.6, 218.5, 220.5, 222.4, 224.3, 226.3, 228.2, 230.2, 232.1, 234.1, 238.1, 242.1, 246.2, 250.3, 254.3, 258.4, 262.4, 266.5, 270.5, 274.5, 278.6, 282.6, 286.7, 290.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8, 294.8];
        return ManifoldAirTempF[parseInt(v)];}
    byte6(v, ecmValues) {return (parseInt(v) * 5 / 255).toFixed(1);}
    byte7(v, ecmValues) {return (parseInt(v) * 5 / 255).toFixed(1);}
    byte8(v, ecmValues) {return (parseInt(v) * 5 / 255).toFixed(1);}
    byte9(v, ecmValues) {return v;}
    byte10(v, ecmValues) {return (1.35 * parseInt(v) - 40).toFixed();}
    byte11(v, ecmValues) {return v;}
    byte12(v, ecmValues) {return (12.5 * parseInt(v)).toFixed();}
    byte13(v, ecmValues) {return v;}
    byte14(v, ecmValues) { if (v != 255) { return (1310720 / parseInt(v)).toFixed();} else { return 0; } }
    byte15(v, ecmValues) {
        //let gear = numToBin(v);
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let gear = n; 
        let tc = 7; for (let t in gear) { if (gear[t] == "1") { return tc; } tc--; } return 0;}
    byte16(v, ecmValues) {return v;}
    byte17(v, ecmValues) {return (45 * parseInt(v) / 256).toFixed();}
    byte18(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let egrByte = n;//this.numToBin(v);
        let egrNum = 7; 
        for (let bitSpot in egrByte) { 
            if (egrNum <= 2) {
                if (egrByte[bitSpot] == "1") {
                    switch(egrNum) {
                        case 0:
                            ecmValues.EGR1 = true;
                            break;
                        case 1:
                            ecmValues.EGR2 = true;
                            break;
                        case 2:
                            ecmValues.EGR3 = true;
                            break;
                        default:
                    }
                } else {
                    switch(egrNum) {
                        case 0:
                            ecmValues.EGR1 = false;
                            break;
                        case 1:
                            ecmValues.EGR2 = false;
                            break;
                        case 2:
                            ecmValues.EGR3 = false;
                            break;
                        default:
                    }
                }
            }
            egrNum--;
        }
        return 0;
    }
    byte19(v, ecmValues) {return v;}
    byte20(v, ecmValues) {return (parseInt(v) / 10).toFixed(1);}
    byte21(v, ecmValues) { ecmValues.injector = parseInt(v); return -1 }
    byte22(v, ecmValues) { return ((ecmValues.injector * 256 + parseInt(v)) / 65.536).toFixed();}
    byte23(v, ecmValues) {return v;}
    byte24(v, ecmValues) {return v;}
    byte25(v, ecmValues) {return (parseInt(v) * 4.42).toFixed() * 0.001;}
    byte26(v, ecmValues) {return v;}
    byte27(v, ecmValues) {return v;}
    byte28(v, ecmValues) {return (parseInt(v) * 4.42).toFixed() * 0.001;}
    byte29(v, ecmValues) {return v;}
    byte30(v, ecmValues) {return v;}
    byte31(v, ecmValues) {return (parseInt(v) / 10).toFixed(1);}
    byte32(v, ecmValues) {
        const ACEVAP = [126.5, 125.5, 125, 124.5, 123.5, 123, 122.5, 121.5, 121, 120.5, 119.5, 119, 118.5, 118, 117, 116.5, 116, 115, 114.5, 114, 113, 112.5, 112, 111.5, 110.5, 110, 109.5, 108.5, 108, 107.5, 106.5, 106, 105.5, 105, 104, 103.5, 103, 102, 101.5, 101, 100, 99.5, 99, 98.5, 97.5, 97, 96.5, 96, 95, 94.5, 93.5, 93, 92.5, 92, 91, 90.5, 90, 89.5, 88.5, 87.5, 86.5, 85.5, 84.5, 84, 83, 82, 81, 80.5, 79.5, 78.5, 78, 77, 76.5, 75.5, 74.5, 74, 73, 72.5, 71.5, 71, 70, 69.5, 69, 68, 67.5, 66.5, 66, 65.5, 64.5, 64, 63, 62.5, 62, 61, 60.5, 60, 59.5, 58.5, 58, 57.5, 56.5, 56, 55.5, 55, 54, 53.5, 53, 52.5, 52, 51, 50.5, 50, 49.5, 49, 48, 47.5, 47, 46.5, 46, 45.5, 44.5, 44, 43.5, 43, 42.5, 42, 41.5, 40.5, 40, 39.5, 39, 38.5, 38, 37.5, 37, 36, 35.5, 35, 34.5, 34, 33.5, 33, 32.5, 31.5, 31, 30.5, 30, 29.5, 29, 28.5, 28, 27.5, 26.5, 26, 25.5, 25, 24.5, 24, 23.5, 23, 22, 21.5, 21, 20.5, 19.5, 19, 18.5, 17.5, 17, 16.5, 15.5, 15, 14.5, 14, 13, 12.5, 12, 11, 10.5, 10, 9, 8.5, 8, 7.5, 6.5, 6, 5.5, 4.5, 4, 3.5, 2.5, 2, 1.5, 1, 0, -0.5, -1, -2, -2.5, -3, -4, -4.5, -5, -5.5, -6.5, -7, -7.5, -8.5, -9, -9.5, -10.5, -11, -11.5, -12, -13, -13.5, -14, -15, -15.5, -16, -17, -17.5, -18, -18.5, -19.5, -20, -20.5, -21.5, -22, -22.5, -23.5, -24, -24.5, -25, -26, -26.5, -27, -28, -28.5, -29, -30, -30.5, -31, -31.5, -32.5, -33, -33.5, -34.5, -35, -35.5, -36.5, -37, -37.5, -38, -39, -39.5];
        return ACEVAP[parseInt(v)];}
    byte33(v, ecmValues) {return v;}
    byte34(v, ecmValues) {return (parseInt(v) * 90 / 256).toFixed();}
    byte35(v, ecmValues) {return (parseInt(v) / 2.55).toFixed();}
    byte36(v, ecmValues) {
        ecmValues.engStr += "<b style='color:yellow;'>SPI INPUT DISCRETES STATUS REGISTER #3:</b><br/><small style='color:aqua;'>(QDM FAULT CANNOT BE USED UNLESS ALL QDM OUTPUTS ARE CONTROLLED FOR TESTING)</small><br/>";
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsSPI = n;//this.numToBin(v);
        let tc = 7;
        for (let t in bitsSPI) {
            if (tc == 0 && bitsSPI[t] == "1") {
                ecmValues.engStr += "-BLOCK LEARN ENABLED<br/>";
            } else if (tc == 1 && bitsSPI[t] == "1") {
                ecmValues.engStr += "-A.I.R. DIVERT FLAG<br/>";
            } else if (tc == 2) {
                if (bitsSPI[t] == "1") {
                    ecmValues.engStr += "[LEFT|FRONT] OXYGEN SENSOR [READY]<br/>";
                } else if (bitsSPI[t] == "0") {
                    ecmValues.engStr += "[LEFT|FRONT] OXYGEN SENSOR [NOT READY]<br/>";
                }
            } else if (tc == 3) {
                if (bitsSPI[t] == "1") {
                    ecmValues.engStr += "[RIGHT|REAR] OXYGEN SENSOR [READY]<br/>";
                } else if (bitsSPI[t] == "0") {
                    ecmValues.engStr += "[RIGHT|REAR] OXYGEN SENSOR [NOT READY]<br/>";
                }
            } else if (tc == 4 && bitsSPI[t] == "1") {
                ecmValues.engStr += "-CLOSED LOOP A/F MODE ENABLED<br/>";
            } else if (tc == 5 && bitsSPI[t] == "1") {
                ecmValues.engStr += "--QDM FAULT 3 DETECTED<br/>";
            } else if (tc == 6 && bitsSPI[t] == "1") {
                ecmValues.engStr += "--QDM FAULT 4 DETECTED<br/>";
            } else if (tc == 7 && bitsSPI[t] == "1") {
                ecmValues.engStr += "--QDM FAULT 5 DETECTED<br/>";
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
        let bitsALDL = n;//this.numToBin(v);
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>ALDL STATUS</b><br/>";
        for (let t in bitsALDL) {
            if (tc == 0 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-CAM PULSE SEEN<br/>";
            } else if (tc == 1 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-KICKDOWN PATTERN ACTIVE/NOT IDLE(Manual)<br/>";
            } else if (tc == 2 && bitsALDL[t] == "0") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "--QDM INJECTOR FAULT<br/>";
            } else if (tc == 3) {
                // Not Used.
            } else if (tc == 4 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C REQUESTED<br/>";
            } else if (tc == 5 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C CLUTCH RELAY ON<br/>";
            } else if (tc == 6 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "--QDM FAULT 1 Detected<br/>";
            } else if (tc == 7 && bitsALDL[t] == "1") {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "--QDM FAULT 2 Detected<br/>";
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
        let bits = n;//this.numToBin(v);
        let tc = 7;
        let tccStr = "";
        let title = true;
        let titleStr = "<b style='color:yellow;'>TRANSMISSION STATUS</b><br/>";
        for (let t in bits) {
            if (tc == 0 && bits[t] == "1") {
                ecmValues.fanOn = true;
            } else if (tc == 0 && bits[t] == "0") {
                ecmValues.fanOn = false;
            } else if (tc == 2 && bits[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-NORMAL/SNOW (X1R)<br/>";
            } else if (tc == 4) {
                tccStr = bits[t];
            } else if (tc == 5) {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                tccStr += bits[t];
                if (tccStr == "11") {
                    ecmValues.tranStr += "Trans in Gear: 1<br/>";
                } else if (tccStr == "01") {
                    ecmValues.tranStr += "Trans in Gear: 2<br/>";
                } else if (tccStr == "00") {
                    ecmValues.tranStr += "Trans in Gear: 3<br/>";
                } else if (tccStr == "10") {
                    ecmValues.tranStr += "Trans in Gear: 4<br/>";
                }
            } else if (tc == 7 && bits[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                ecmValues.tranStr += "-TCC ENABLE SOL<br/>";
            }
            tc--;
        }
        return -1;
    }
    byte39(v, ecmValues) {return v;}
    byte40(v, ecmValues) {return (12.5 * parseInt(v)).toFixed();}
    byte41(v, ecmValues) {
        ecmValues.acPsi = (parseInt(v) * 1.875 - 18.75).toFixed();
        ecmValues.acVolts = (parseInt(v) * 5 / 255).toFixed(1);
        return ecmValues.acPsi;
    }
    byte42(v, ecmValues) {
        
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let bitsAC = n;//this.numToBin(v);
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>A/C STATUS</b><br/>";
        for (let t in bitsAC) {
            if (bitsAC[t] == "0" && tc == 0) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C CLUTCH ENABLED<br/>";
            } else if (bitsAC[t] == "1" && tc == 1) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C WOT LOGIC USING N/V TIME THRESHOLD<br/>";
            } else if (bitsAC[t] == "1" && tc == 2) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C PRESSURE REQUESTS FAN<br/>";
            } else if (bitsAC[t] == "1" && tc == 4) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C LOAD SWAP (A/C FORCED OFF)<br/>";
            } else if (bitsAC[t] == "1" && tc == 5) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C OLD (6.25 MS.) 3RD GEAR FLAG<br/>";
            } else if (bitsAC[t] == "1" && tc == 6) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C EVAP TEMPERATURE CLUTCH DISABLE<br/>";
            } else if (bitsAC[t] == "1" && tc == 7) {
                if (title) { ecmValues.engStr += titleStr; title = false; }
                ecmValues.engStr += "-A/C CFIV FREON LOW CLUTCH DISABLE<br/>";
            }
            tc--;
        }
        return v;
    }
    byte43(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let brakes = n;//this.numToBin(v);
        let tc = 7;
        for (let t in brakes) {
            if (tc == 5) {
                if (brakes[t] == "1") {
                    ecmValues.tccBrakeEngaged = true;
                } else {
                    ecmValues.tccBrakeEngaged = false;
                }
                break;
            }
            tc--;
        }
        return v;}
    byte44(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let gear = n;//this.numToBin(v);
        let gStr = "";
        let tc = 7;
        for (let t in gear) {
            if (tc > 1 && tc < 6) {
                if (tc == 2) {
                    gStr = gear[t];
                } else if (tc == 3) {
                    gStr += gear[t];
                    if (gear[t] == "1") {
                        ecmValues.clutchEngaged = true;
                    } else if (gear[t] == "0") {
                        ecmValues.clutchEngaged = false;
                    }
                } else if (tc == 4) {
                    gStr += gear[t];
                } else if (tc == 5 && gear[t] == "0") {
                    ecmValues.engStr += "[ENGINE] INJECTOR FAULT<br/>";
                }
            }
            tc--;
        }
        if (gStr == "011") {/*D4*/
            ecmValues.tranStr += " (Drive-4)<br/>";
        } else if (gStr == "100") {/*D2*/
            ecmValues.tranStr += " (Low / Drive-2)<br/>";
        } else if (gStr == "110") {/*Reverse*/
            ecmValues.tranStr += " (Reverse)<br/>";
        } else if (gStr == "001") {/*D3*/
            ecmValues.tranStr += " (Drive-3)<br/>";
        } else if (gStr == "010") {/*Park Nuetral*/
            ecmValues.tranStr += " (Park/Neutral)<br/>";
        }
        return -1;
    }
    byte45(v, ecmValues) {return v;}/* DTC codes */
    byte46(v, ecmValues) {
        let value = (parseInt(v) / 2.55).toFixed(2);
        ecmValues.tranStr += "TCC DUTY CYCLE: " + value + " %<br/>";
        return value;
    }
    byte47(v, ecmValues) {
        let value = (parseInt(v) / 2.55).toFixed(2);
        ecmValues.tranStr += "FORCE MOTOR DUTY CYCLE: " + value + " %<br/>";
        return value;
    }
    byte48(v, ecmValues) {
        let value = (parseInt(v) / 2.55).toFixed(2);
        ecmValues.tranStr += "3->2 DOWNSHIFT SOLENOID DUTY CYCLE: " + value + " %<br/>";
        return value;
    }
    byte49(v, ecmValues) {
        ecmValues.tranStr += "AMOUNT OF TCC SLIPPAGE MSB: " + v + "<br/>";
        return v;
    }
    byte50(v, ecmValues) {
        let value = (parseInt(v) / 8).toFixed(2);
        ecmValues.tranStr += "AMOUNT OF TCC SLIPPAGE LSB: " + value + " (RPM)<br/>";
        return value;
    }
    byte51(v, ecmValues) {
        ecmValues.tranStr += "FILTERED OUTPUT SHAFT SPEED MSB: " + v + "<br/>";
        return v;
    }
    byte52(v, ecmValues) {
        let value = (parseInt(v) / 8).toFixed(2);
        ecmValues.tranStr += "FILTERED OUTPUT SHAFT SPEED LSB: " + value + " (RPM)<br/>";
        return value;
    }
    byte53(v, ecmValues) {
        ecmValues.tranStr += "FILTERED INPUT SHAFT SPEED MSB: " + v + "<br/>";
        return v;
    }
    byte54(v, ecmValues) {
        let value = (parseInt(v) / 8).toFixed(2);
        ecmValues.tranStr += "FILTERED INPUT SHAFT SPEED LSB: " + value + " (RPM)<br/>";
        return value;}
    byte55(v, ecmValues) {
        ecmValues.tranStr += "COMMANDED PRESSURE: " + v + " Psi<br/>";
        return v;}
    byte56(v, ecmValues) {
        let value = (parseInt(v) / 51).toFixed(1);
        ecmValues.tranStr += "FORCE MOTOR COMMAND CURRENT: " + value + " (AMPS)<br/>";
        return value;}
    byte57(v, ecmValues) {
        let value = (parseInt(v) / 51).toFixed(1);
        ecmValues.tranStr += "FORCE MOTOR ACTUAL CURRENT: " + value + " (AMPS)<br/>";
        return value;}
    byte58(v, ecmValues) {
        ecmValues.tranStr += "CURRENT ADAPTIVE MODIFIER: " + v + "<br/>";
        return v;}
    byte59(v, ecmValues) {
        let cCell = parseInt(v);
        if (cCell >= 0 && cCell <= 16) {
            let value = (cCell / 0.16).toFixed();
            ecmValues.tranStr += "CURRENT ADAPTIVE CELL: " + value + " %<br/>";
            return value;
        } else {
            ecmValues.tranStr += "CURRENT ADAPTIVE CELL: Invalid Reading<br/>";
        }
        return 0;}
    byte60(v, ecmValues) {
        let value = (parseInt(v) / 40).toFixed();
        ecmValues.tranStr += "1->2 SHIFT ERROR: " + value + " (Sec)<br/>";
        return value;}
    byte61(v, ecmValues) {
        let value = (parseInt(v) / 40).toFixed();
        ecmValues.tranStr += "2->3 SHIFT ERROR: " + value + " (Sec)<br/>";
        return value;}
    byte62(v, ecmValues) {
        let value = (parseInt(v) / 40).toFixed();
        ecmValues.tranStr += "1->2 SHIFT TIME: " + value + " (Sec)<br/>";
        return value;}
    byte63(v, ecmValues) {
        let value = (parseInt(v) / 40).toFixed();
        ecmValues.tranStr += "2->3 SHIFT TIME: " + value + " (Sec)<br/>";
        return value;}
    byte64(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let transState = n;//this.numToBin(v);
        let tc = 7;
        let title = true;
        let titleStr = "<b style='color:yellow;'>TRANS SHIFT ADAPT STATUS</b><br/>";
        for (let t in transState) {
            if (transState[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                if (tc == "0" || tc == 0) {
                    ecmValues.tranStr += "--ADAPTABLE SHIFT IN PROGRESS<br/>";
                } else if (tc == "1" || tc == 1) {
                    ecmValues.tranStr += "--LOW BARO FOR ADAPTABLE SHIFT<br/>";
                } else if (tc == "2" || tc == 2) {
                    ecmValues.tranStr += "--LONG DLY BEFORE SHIFT FOR ADAPT<br/>";
                } else if (tc == "3" || tc == 3) {
                    ecmValues.tranStr += "--LONG SHIFT BEFORE ADAPT<br/>";
                } else if (tc == "4" || tc == 4) {
                    ecmValues.tranStr += "--RUN THROUGH ADAPT<br/>";
                } else if (tc == "5" || tc == 5) {
                    ecmValues.tranStr += "--STANDARD ADAPT<br/>";
                } else if (tc == "6" || tc == 6) {
                    ecmValues.tranStr += "--LAST LOOP WAS STANDARD ADAPT<br/>";
                } else if (tc == "7" || tc == 7) {
                    ecmValues.tranStr += "--TEMPMW,HOTMODE SHADOW BIT<br/>";
                }
            }
            tc--;
        }
        return -1;}
    byte65(v, ecmValues) {
        let titleStr = "<b style='color:yellow;'>TRANS ADAPTIVE SHIFT CONDITION VIOLATIONS</b><br/>";
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let transState = n;//this.numToBin(v);
        let tc = 7;
        let title = true;
        for (let t in transState) {
            if (transState[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                if (tc == "0" || tc == 0) {
                    ecmValues.tranStr += "--PATTERN IS NOT NORMAL<br/>";
                } else if (tc == "1" || tc == 1) {
                    ecmValues.tranStr += "--TRANSMISSION TEMPERATURE OUT OF RANGE<br/>";
                } else if (tc == "2" || tc == 2) {
                    ecmValues.tranStr += "--THROTTLE OUT OF RANGE<br/>";
                } else if (tc == "3" || tc == 3) {
                    ecmValues.tranStr += "--BRAKE PRESSURE USED THIS SHIFT<br/>";
                } else if (tc == "4" || tc == 4) {
                    ecmValues.tranStr += "--PRNDL IS LO OR D2<br/>";
                } else if (tc == "5" || tc == 5) {
                    ecmValues.tranStr += "--LONG SHIFT DELAY TIME<br/>";
                } else if (tc == "6" || tc == 6) {
                    ecmValues.tranStr += "--FILL/TORQUE PHASES WERE TOO QUICK<br/>";
                } else if (tc == "7" || tc == 7) {
                    ecmValues.tranStr += "--THROTTLE CHANGED TOO MUCH<br/>";
                }
            }
            tc--;
        }
        return -1;
    }
    byte66(v, ecmValues) {
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let transState = n;//this.numToBin(v);
        let tc = 7;
        let titleStr = "<b style='color:yellow;'>TCC STATUS</b><br/>";
        let title = true;
        for (let t in transState) {
            if (transState[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                if (tc == "0" || tc == 0) {
                    ecmValues.tranStr += "--RANGE CONTINGENCY FORCED TCC OFF<br/>";
                } else if (tc == "1" || tc == 1) {
                    ecmValues.tranStr += "--TR. TMP. LIMIT FORCED TCC OFF<br/>";
                } else if (tc == "2" || tc == 2) {
                    ecmValues.tranStr += "--COOLANT TMP. LIM. FORCED TCC OFF<br/>";
                } else if (tc == "3" || tc == 3) {
                    ecmValues.tranStr += "--BRAKE ON FORCED TCC OFF<br/>";
                } else if (tc == "4" || tc == 4) {
                    ecmValues.tranStr += "--NEGATIVE DELT. THROT. FORCED TCC OFF<br/>";
                } else if (tc == "5" || tc == 5) {
                    ecmValues.tranStr += "--DOWNSHIFT CONTINGENCY FORCED TCC OFF<br/>";
                } else if (tc == "6" || tc == 6) {
                    ecmValues.tranStr += "--AC CONTINGENCY FORCED TCC OFF<br/>";
                } else if (tc == "7" || tc == 7) {
                    ecmValues.tranStr += "--SLIP CONTINGENCY FORCED TCC OFF<br/>";
                }
            }
            tc--;
        }
        return -1;
    }
    byte67(v, ecmValues) {
        let titleStr = "<b style='color:yellow;'>TCC STATUS</b><br/>";
        let title = true;
        let n = parseInt(v).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        let transState = n;//this.numToBin(v);
        let tc = 7;
        for (let t in transState) {
            if (transState[t] == "1") {
                if (title) { ecmValues.tranStr += titleStr; title = false; }
                if (tc == "0" || tc == 0) {
                    ecmValues.tranStr += "--UPSHIFT CONTINGENCY FORCED TCC OFF<br/>";
                } else if (tc == "1" || tc == 1) {
                    ecmValues.tranStr += "--MINIMUM THROTTLE CONT. FORCED TCC OFF<br/>";
                } else if (tc == "2" || tc == 2) {
                    ecmValues.tranStr += "--DIAGNOSTIC CONTINGENCY FORCED TCC OFF<br/>";
                } else if (tc == "3" || tc == 3) {
                    ecmValues.tranStr += "--OUTPUT SPEED LOSS FORCED TCC OFF<br/>";
                } else if (tc == "4" || tc == 4) {
                    ecmValues.tranStr += "--PRNDL D3 FORCED TCC OFF<br/>";
                } else if (tc == "5" || tc == 5) {
                    ecmValues.tranStr += "--PRNDL D4 FORCED TCC OFF<br/>";
                }
            }
            tc--;
        }
        return -1;
    }
    
}
