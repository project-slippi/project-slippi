package main

import (
  "bytes"
  "encoding/hex"
  "fmt"
  "io/ioutil"
  "log"
  "os"
  "os/exec"
  "strings"
)

func main() {
  getInjectionCodeLines("8016e74c", "SendGameInfo.asm")
  getInjectionCodeLines("8006b0dc", "SendGameFrame.asm")
}

func getInjectionCodeLines(address, file string) []string {
  instructions := compile(file)

  // Fixes code to always end with 0x00000000 and have an even number of words
  if (len(instructions) % 8 == 0) {
    instructions = append(instructions, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
  } else {
    instructions = append(instructions, 0x00, 0x00, 0x00, 0x00)
  }

  fmt.Printf("%s%s %08X\n", "C2", strings.ToUpper(address[2:]), len(instructions) / 8)
  for i := 0; i < len(instructions); i += 8 {
    left := strings.ToUpper(hex.EncodeToString(instructions[i:i + 4]))
    right := strings.ToUpper(hex.EncodeToString(instructions[i + 4:i + 8]))
    fmt.Printf("%s %s\n", left, right)
  }

  return []string{}
}

func compile(file string) []byte {
  defer os.Remove("a.out")

  cmd := exec.Command("powerpc-gekko-as.exe", "-a32", "-mbig", "-mregnames", "-mgekko", file)
  if err := cmd.Run(); err != nil {
    log.Fatal(err)
    panic(fmt.Sprintf("Failed to compile file %s", file))
  }

  contents, err := ioutil.ReadFile("a.out")
  if (err != nil) {
    log.Fatal(err)
    panic(fmt.Sprintf("Failed to read compiled file %s", file))
  }
  codeEndIndex := bytes.Index(contents, []byte{0x00, 0x2E, 0x73, 0x79, 0x6D, 0x74, 0x61, 0x62})

  return contents[52:codeEndIndex]
}