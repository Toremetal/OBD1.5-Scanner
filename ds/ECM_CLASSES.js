class ECM_CLASSES {
    
    ecmOptions() {
        return `
        <optgroup label="CAMARO (f-car)">
            <option value="ECM278">(94-95) 3.4l</option>
        </optgroup>
        <optgroup label="BETA (Not-Tested)">
            <option value="ECM221">(94-95) 3.8l</option>
        </optgroup>`;/*
        <optgroup label="94-95 3.8l">
            <option value="ECM258">3.4l-m</option>
            <option value="ECM221">3.8l</option>
        </optgroup>*/
    }
    
    setECM(file) {
        if (file == "ECM278") {
            return new ECM278();
        //} else if (file == "ECM258") {
        //    return new ECM258();
        } else if (file == "ECM221") {
            return new ECM221();
        }
    }
    
    getCheckSum(data) {
        let sum = 0;
        for (let c in data) {
            sum = sum + (256 - parseInt(data[c]));
        }
        return (sum % 256); // dataCheckSum
    }
    
    testCheckSum(data, checkSum) {
        let sum = 0;
        for (let c in data) {
            sum = sum + (256 - parseInt(data[c]));
        }
        return parseInt(sum % 256) == parseInt(checkSum);
    }
    
    /* Byte Conversion Algorithms. */
    alphaToNumeric(l) {
        let nl = "0x" + l;
        let abn = parseInt(nl);
        let iabn = abn.toString();
        return parseInt(iabn);
    }

    numericToAlpha(i) {
        let n = parseInt(i);
        let a = n.toString(16).toUpperCase();
        if (a.length == 1) { a = "0" + a; }
        return a;
    }

    numToBin(i) {
        let n = parseInt(i).toString(2);
        while (n.length != 8) {
            n = "0" + n;
        }
        return n;
    }

    binToDec(str) {
        let c = 0;
        for (let c = 0; c < 256; c++) {
            if (numToBin(c) == str) {
                return c;
            }
        }
        return -1;
    }
    /* [END]: Byte Conversion Algorithms. */

}