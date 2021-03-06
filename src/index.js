import Nprogress from 'nprogress'
import * as util from './util'
import {onReload} from './notify'
import Bus from './bus'
import header from './header'
import {navigateBack, navigateTo, currentView} from './viewManage'
import {onBack} from './service'
import toast from './toast'
import tabbar from './tabbar'
import {lifeSycleEvent} from './service'
require('./message')
require('./polyfill')

Nprogress.start()
util.createFrame('service', '/appservice', true)

header.on('back', () => {
  let curr = currentView()
  navigateBack()
  if (!curr.external) onBack()
})

tabbar.on('active', url => {
  let curr = currentView()
  if (curr && curr.url == url) return
  let {path, query} = util.parsePath(url)
  navigateTo(path, true)
  lifeSycleEvent(path, query, 'switchTab')
})

Bus.on('route', (n, curr) => {
  if(util.isTabbar(curr.url)) {
    tabbar.show(curr.url)
  } else {
    tabbar.hide()
  }
  header.resetTitle()
  if (curr.pid != null) {
    header.backStatus(true)
  } else {
    header.backStatus(false)
  }
})

let socket = new WebSocket(`ws://${location.host}`)
socket.onopen = function () {
  console.log('=> socket open')
}

socket.onmessage = function (e) {
  let data = JSON.parse(e.data)
  let p = data.path
  if (data.type == 'error') {
    toast(data.msg || '未知错误', {type: 'error'})
  } else if (data.type == 'reload'){
    if (!p) {
      redirectToHome()
    } else {
      onReload(p)
    }
  }
}

socket.onerror = function (e) {
  console.error('socket error ' + e.message)
}

window.addEventListener('unload', function () {
  // reload all pages
  socket.close()
})

function redirectToHome() {
  window.location.reload()
}
