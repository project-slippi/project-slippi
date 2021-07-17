package main

import (
	"encoding/binary"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
)

type errorDetails struct {
	count   int
	message string
	files   []string
}

type results struct {
	numSkipped   int
	numProcessed int
	errors       map[string]errorDetails
}

var res results
var codeset []byte

func main() {
	codeFilePath := "./summit11-codes.bin"
	folderToConvert := "/Users/Fizzi/Downloads/Summit11Day1" // Recursive

	res.errors = map[string]errorDetails{}
	cs, err := ioutil.ReadFile(codeFilePath)
	if err != nil {
		log.Panicf("Error reading codes file")
	}
	codeset = cs

	err = filepath.Walk(folderToConvert, func(path string, info os.FileInfo, err error) error {
		if !info.IsDir() && filepath.Ext(info.Name()) == ".slp" {
			addCodesetToFile(path)
		}

		return nil
	})

	if err != nil {
		log.Panicf("Error walking path: %s", err.Error())
	}

	fmt.Println("============= Results =============")
	fmt.Printf("%d replays converted\n", res.numProcessed)
	fmt.Printf("%d replays skipped because they already had a gecko codeset\n", res.numSkipped)
}

func addCodesetToFile(path string) {
	buf, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panicf("Error reading file %s", path)
	}

	geckoCodesFound := false
	payloadMsgLen := buf[0x10]
	var gameInfoLen uint16
	for i := 0x11; i < 0x10+int(payloadMsgLen); i += 3 {
		cmd := buf[i]
		if cmd == 0x3D {
			geckoCodesFound = true
		} else if cmd == 0x36 {
			gameInfoLen = binary.BigEndian.Uint16(buf[i+1 : i+3])
		}
	}

	if geckoCodesFound {
		res.numSkipped++
		return
	}

	// Add codeset length to payload messages
	lenPos := 0x10 + int(payloadMsgLen)
	bs := make([]byte, 2)
	binary.BigEndian.PutUint16(bs, uint16(len(codeset)))
	outBuf := append(buf[:lenPos], append([]byte{0x3D, bs[0], bs[1]}, buf[lenPos:]...)...)

	// Overwrite payload lengths size
	outBuf[0x10] += 3

	// Add codeset
	csPos := lenPos + 4 + int(gameInfoLen)
	csWithCmd := append([]byte{0x3D}, codeset...)
	outBuf = append(outBuf[:csPos], append(csWithCmd, outBuf[csPos:]...)...)

	// Overwrite file
	err = ioutil.WriteFile(path, outBuf, 0666)
	if err != nil {
		log.Panicf("Error writing file %s", path)
	}

	res.numProcessed++
}
