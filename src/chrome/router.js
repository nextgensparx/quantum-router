'use strict';
/* global chrome*/

/**
 * Controls access to the router
 */
class _RouterController {
  sendRuntimeMessage(data) {
    // TODO: Handle chrome message sending errors
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(data, (r) => resolve(r));
    });
  }

  getTab() {
    return this.sendRuntimeMessage({
      from: 'app',
      type: 'get',
      get: 'tab',
    });
  }

  _sendTabMessage(id, data) {
    // TODO: Handle chrome message sending errors
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(id, data, (r) => resolve(r));
    });
  }

  async sendTabMessage(data) {
    const tab = await this.getTab();
    // TODO: Handle no tab found
    data.from = 'RouterController';
    return this._sendTabMessage(tab.id, data);
  }

  _sendPageMessage(data) {
    return this.sendTabMessage({
      command: 'pageMessage',
      data: data,
    });
  }

  _xmlAjax(url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/xml');
      xhr.overrideMimeType('application/xml');
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          resolve(xhr.responseXML);
        } else {
          reject(xhr.statusText);
        }
      };
      xhr.onerror = () => {
        reject(xhr.statusText);
      };
      xhr.send();
    });
  }

  _recursiveXml2Object(xml) {
    if (xml.children.length > 0) {
      let _obj = {};
      Array.prototype.forEach.call(xml.children, function(el) {
        let _childObj = (el.children.length > 0) ? this._recursiveXml2Object(el) : el.textContent;
        let siblings = Array.prototype.filter.call(el.parentNode.children, function(child) {
          return child !== el;
        });
        // If there is more than one of these elements, then it's an array
        if (siblings.length > 0 && siblings[0].tagName == el.tagName) {
          if (_obj[el.tagName] === null) {
            _obj[el.tagName] = [];
          }
          _obj[el.tagName].push(_childObj);
          // Otherwise just store it normally
        } else {
          _obj[el.tagName] = _childObj;
        }
      });
      return _obj;
    } else {
      return xml.textContent;
    }
  }

  _xml2object(xml) {
    let obj = {};
    obj.type = xml.documentElement.tagName;
    obj.data = this._recursiveXml2Object(xml.documentElement);
    return obj;
  }

  async getAjaxDataDirect(url) {
    return new Promise(async (resolve) => {
      const tab = await this.getTab();
      const parsedUrl = new URL(tab.url);
      const xml = await this._xmlAjax(parsedUrl.origin + '/' + url);
      // TODO: Make sure xml is type document
      resolve(this._xml2object(xml));
    });
  }

  getAjaxData(data) {
    data.type = 'command';
    data.command = 'getAjaxData';
    return this._sendPageMessage(data);
  }

  saveAjaxData(data) {
    data.type = 'command';
    data.command = 'saveAjaxData';
    return this._sendPageMessage(data);
  }

  /**
   * Checks if an ajax return is valid by checking if the response is 'ok'
   * @private
   * @param   {object}  ret The AJAX return
   * @returns {boolean} if the response is ok
   */
  _isAjaxReturnOk(ret) {
    return ret.response.toLowerCase() === 'ok';
  }

  /**
   * Sends a USSD command to the router
   * @param {string}   command  the command to send
   */
  async sendUssdCommand(command) {
    return new Promise(async (resolve, reject) => {
      const ret = await this.saveAjaxData({
        url: 'api/ussd/send',
        request: {
          content: command,
          codeType: 'CodeType',
          timeout: '',
        },
        options: {
          enc: true,
        },
      });

      if (this._isAjaxReturnOk(ret)) {
        resolve(this.getAjaxData({
          url: 'api/ussd/get',
        }));
      } else {
        reject(ret);
      }
    });
  }

  /**
   * Gets the number of read and unread messages
   * @return {Promise}
   */
  async getSmsCount() {
    return new Promise(async (resolve, reject) => {
      let ret = await this.getAjaxDataDirect('api/sms/sms-count');
      if (ret.type === 'response') {
        resolve(ret.data);
      } else {
        reject(ret);
      }
    });
  }

  /**
   * Get's the list of SMSs from the router
   * @param {Object} options Options
   * @return {Promise}
   */
  getSmsList(options) {
    options = Object.assign({
      page: 1,
      perPage: 20,
      boxType: 1,
      sortOrder: 'desc',
    }, options);
    /*
    SMS_BOXTYPE_INBOX = 1
    SMS_BOXTYPE_SENT = 2
    SMS_BOXTYPE_DRAFT = 3
    */
    return this.saveAjaxData({
      url: 'api/sms/sms-list',
      request: {
        PageIndex: options.page,
        ReadCount: options.perPage,
        BoxType: options.boxType,
        SortType: 0,
        Ascending: options.sortOrder === 'desc' ? 0 : 1,
        UnreadPreferred: 0,
      },
    }).then((ret) => {
      if (ret.type === 'response') {
        return ret.response;
      } else {
        return Promise.reject(new Error('Returned ajax data is not of type response'));
      }
    });
  }
}

export let RouterController = new _RouterController();
