## OTTO

![OTTO](assets/otto.png)


### Development

* Start a local https server
  * E.g. with ruby:
  ```ruby
  ruby -r webrick/https -e 'WEBrick::HTTPServer.new(Port: 8000, DocumentRoot: ".", SSLEnable: true, SSLCertName: [%w[CN localhost]]).start'
  ```
* Open https://localhost:8000/ or https://otto.lvh.me:8000/
* When done, commit your changes and sync to the SFTP server.