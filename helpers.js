const volumeLevel = messageContent => {
  return parseFloat(messageContent.split(' ')[1], 10);
};

const parseBotCommand = messageContent => {
  return messageContent.split(' ')[0];
};

const isConductor = (idConstant, id) => {
  return id === idConstant;
};

const isUndefined = value => value === undefined;

const anyUndefined = (object, keyNames) => {
  for (let i = 0, keyName = keyNames[i]; i < keyNames.length; i++) {
    if (isUndefined(object[keyName])) {
      return true;
    }
  }
  return false;
};

module.exports = {
  volumeLevel,
  parseBotCommand,
  isConductor,
  isUndefined,
  anyUndefined
};
