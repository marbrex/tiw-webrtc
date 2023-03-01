### Installation en local
---

- Télécharger la dernière version de l'image [marbrex/react-webrtc](https://hub.docker.com/r/marbrex/react-webrtc) depuis DockerHub:  
  ```bash
  docker pull marbrex/react-webrtc
  ```

> *Remarque:* Cette commande télécharge l'image pour l'architecture `amd64`
> Pour l'architecture `arm64`, utilisez le tag correspondant (i.e. `:linux-arm64`)

- Lancer un container:  
  ```bash
  docker run -d --name react-webrtc -p 3000:3000 marbrex/react-webrtc
  ```

> *Remarque:* Enlever l'option `-d` pour afficher les logs dans le terminal.


