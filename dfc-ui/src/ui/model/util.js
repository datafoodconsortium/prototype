import postal from 'postal';
export default class Util {
  async getConfig(){
    let response = await fetch(`${url_server}/data/core/config`);
    let out = await response.json();
    return out ;
  }
  ajaxCall(url, option) {
    option = option || {};
    // console.log('ajaxCall', url, option);
    return new Promise((resolve, reject) => {
      let token = localStorage.getItem('token');

      // console.log('ALLLO',token);
      if (token != undefined && token != 'undefined') {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", 'JWT' + ' ' + token);
        myHeaders.append("Content-Type", 'application/json');
        var myInit = {
          headers: myHeaders,
          mode: 'cors'
        };

        Object.assign(option, myInit);
        postal.publish({
          channel: 'ui',
          topic: 'activLoader'
        });
        fetch(url, option).then(async function(response) {
          postal.publish({
            channel: 'ui',
            topic: 'hideLoader'
          });
          if (response.ok) {
            // console.log('OK!',response);
            let headers = {};
            let headerString = response.status.toString();

            response.headers.forEach(function(value, name) {
              // headers[name] = value;
              headerString = headerString.concat(String.fromCharCode(10))
              headerString = headerString.concat(name + ": " + value)

              // console.log(name + ": " + value);
            });
            let body = await response.json();
            resolve({
              body: body,
              headers: headerString
            })
            // return response.json();
          } else {
            console.log('error', response);
            let errorMessage;
            try {
              let error = await response.json();
              errorMessage= error.message;
              // throw new Error (error.message)
              reject(new Error(error.message));
            } catch (e) {
              errorMessage= await response.text();
            } finally {

            }
            // let error = await response.json();
            // throw new Error (error.message)
            reject(new Error(errorMessage));
          }

        }).catch(e => {
          postal.publish({
            channel: 'ui',
            topic: 'hideLoader'
          });
          reject(e);
        });
        // .then(function(data) {
        //   resolve(data)
        // }).catch(e => {
        //   reject(e);
        // });
      } else {
        reject(new Error('no token in localstorage'))
      }

    })
  }
}
