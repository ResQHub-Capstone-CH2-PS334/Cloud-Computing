const __ERRLIB = {
  SignerError: {
    foreign: 'foreign token',
    expired: 'expired token',
    invalid: 'invalid token',
    mismatch: 'mismatch text and hashed text',
    unknown: 'unidentified error',
    illegal: 'illegal request'
  },
  MethodsError: {
    registeredEmail: 'email already registered',
    corruptedEmail: 'invalid email for request',
    registeredUsername: 'username already registered',
    unrecognized: 'invalid username',
    alreadyIn: 'already logged in',
    alreadyOut: 'already logged out',
    illegal: 'illegal request'
  },
  FireError: {
    documentMissing: 'no document found'
  }
}

class DefaultError extends Error {
  constructor (__funcName, __status) {
    super()
    this.functionName = __funcName
    this.status = __status
  }

  readError () {
    return {
      status: this.status,
      description: 'at ' + this.functionName + '(): ' + this.description
    }
  }
}

class MethodsError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.MethodsError[__status]
  }
}

class SignerError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.SignerError[__status]
  }
}

class SessionError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.SessionError[__status]
  }
}

class FireError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.FireError[__status]
  }
}
module.exports = {
  MethodsError,
  SignerError,
  SessionError,
  FireError
}
