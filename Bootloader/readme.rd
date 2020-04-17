start address 0x79000, better for ghidra, pick arm cortex little endian as language when importing file

no version, there is just line with Cortex, anyway it looks pretty ugly, I think I found LCD init and fill methods

see https://gist.github.com/fanoush/a9a87bd4bfecfd6a1fa9e502dd656447 , this is just a guess, ididn't look deeply into what SPI Cmd and Data does (so could be even i2c, i just guess lcd is spi) you may check in ghidra locations 00079774 and 0007c77c

looks pretty similar to HX03W display, init values are in different order but mostly the same, sending data looks same

ugly means it looks like they maybe used nordic drivers for hardware, every gpio method is pretty complicated, or they used poor compiler, there is lot of duplicated code doing same thing, but the high level code - display initialization looks familiar so the rest can be guessed, look like the pin numbers match what you already have 0x13,0x16,0x14,0x1a