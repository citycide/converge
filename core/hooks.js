'use strict'

const Promise = require('bluebird')
const exitHook = require('async-exit-hook')
const once = require('stunsail/fn/once')
const toArray = require('stunsail/to/array')

let hooks = {
  ready: [],
  beforeMessage: [],
  receivedCommand: [],
  beforeCommand: [],
  afterCommand: [],
  beforeShutdown: []
}

let getContext = exports.loadHooks = once(context => context)

exports.getHooks = () => Object.keys(hooks)

exports.registerHook = (name, fn) => {
  hooks[name].push(fn)
}

exports.callHook = name => {
  let context = getContext()
  let args = toArray(arguments, 1)
  args.unshift(context)

  context.emit.apply(context, [name].concat(args))
  hooks[name] && hooks[name].forEach(fn => fn.apply(context, args))
}

exports.callHookAndWait = name => {
  let context = getContext()
  let args = toArray(arguments, 1)
  args.unshift(context)

  return Promise.all([
    context.emitAsync.apply(context, [name].concat(args)),
    hooks[name] && hooks[name].map(fn => fn.apply(context, args))
  ]).then(([events, hooks]) => { /* TODO: return something? */ })
}

exports.exitHooks = context => {
  exitHook(done => context.shutdown().then(done))
  exitHook.uncaughtExceptionHandler((e, done) => {
    return context.shutdown().then(done)
  })
}
