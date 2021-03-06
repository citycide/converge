/**
 * @typedef {import("@converge/types").PluginCommandHandler} PluginCommandHandler
 * @typedef {import("@converge/types").PluginSetup} PluginSetup
 */

/**
 * @type {PluginCommandHandler}
 */
export const cooldown = async ($, e) => {
  switch (e.subcommand) {
    case "get": return get($, e)
    case "set": return set($, e)
    case "admin": return admin($, e)
    default: return e.respond(await $.weave("usage"))
  }
}

/**
 * @type {PluginCommandHandler}
 */
const get = async ($, e) => {
  const [cmd, sub] = e.subArgs
  const subStr = sub ? ` ${sub}` : ""

  if (!cmd) {
    return e.respond(await $.weave("get.usage"))
  }

  const cool = await $.command.getCooldown(cmd, sub)

  if (!$.is.number(cool)) {
    return e.respond(await $.weave("get.no-cooldown", cmd, subStr))
  }

  return e.respond(await $.weave("get.response", cmd, sub, cool))
}

/**
 * @type {PluginCommandHandler}
 */
const set = async ($, e) => {
  const [cmd, sub, val] = e.subArgs

  if (!cmd) {
    return e.respond(await $.weave("set.usage"))
  }

  if (e.subArgs.length === 2) {
    // provided a command and cooldown value only
    const num = parseInt(sub)

    if ($.is.number(num)) {
      return e.respond(await $.weave("set.usage"))
    }

    if (!await $.command.exists(cmd)) {
      return e.respond($.weave.core("commands.does-not-exist"))
    }

    await $.command.setCooldown(cmd, num)
    return e.respond(await $.weave("set.success", cmd, num))
  } else if (e.subArgs.length === 3) {
    // provided a command, subcommand, and cooldown value
    const subNum = parseInt(val)

    if (!$.is.number(subNum)) {
      return e.respond(await $.weave("set.usage"))
    }

    if (!await $.command.exists(cmd, sub)) {
      return e.respond($.weave.core("commands.does-not-exist"))
    }

    await $.command.setCooldown(cmd, subNum, sub)
    return e.respond(await $.weave("set.success-sub", cmd, sub, subNum))
  } else {
    return e.respond(await $.weave("set.usage"))
  }
}

/**
 * @type {PluginCommandHandler}
 */
const admin = async ($, e) => {
  const [status] = e.subArgs

  if (!$.is.oneOf(status, ["enabled", "disabled"])) {
    return e.respond(await $.weave("admin.usage"))
  }

  const bool = $.is(status, "enabled")
  await $.db.setPluginConfig("cooldown.includeAdmins", bool)
  e.respond(await $.weave("admin.response", bool ? "enabled" : "disabled"))
}

/**
 * @type {PluginSetup}
 */
export const setup = $ => {
  $.addCommand("cooldown", { permission: 1 })
  $.addSubcommand("get", "cooldown")
  $.addSubcommand("set", "cooldown")
  $.addSubcommand("admin", "cooldown")
}
