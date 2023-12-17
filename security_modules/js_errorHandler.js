const ERRS = [
  ' (SignerError)',
  ' (MethodsError)',
  '(FireError)',
  ' (SessionError)',
  ' (MapsError)'
]

const __ERRLIB = {
  SignerError: {
    foreign: 'foreign token' + ERRS[0],
    expired: 'expired token' + ERRS[0],
    invalid: 'invalid token' + ERRS[0],
    mismatch: 'mismatch text and hashed text' + ERRS[0],
    unknown: 'unidentified error' + ERRS[0],
    illegal: 'illegal request' + ERRS[0]
  },
  MethodsError: {
    registeredEmail: 'email already registered' + ERRS[1],
    corruptedEmail: 'invalid email for request' + ERRS[1],
    registeredUsername: 'username already registered' + ERRS[1],
    unrecognized: 'invalid username' + ERRS[1],
    alreadyIn: 'already logged in' + ERRS[1],
    alreadyOut: 'already logged out' + ERRS[1],
    illegal: 'illegal request' + ERRS[1]
  },
  FireError: {
    documentMissing: 'no document found' + ERRS[2]
  },
  SessionError: {
    activeSessionMismatch: 'active session does not match' + ERRS[3],
    unknown: 'unidentified error' + ERRS[3],
    wrongType: 'Expected either RT/AT, providing wrong type' + ERRS[3],
    illegal: 'Illegal access' + ERRS[3]
  },
  MapsError: {
    nothing: 'found nothing' + ERRS[4],
    unknown: 'unidentified error' + ERRS[0],
    outage: 'API is expired or not deactivated!'
  },
  TranscriberError: {
    invalid: 'invalid audio file'
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

class MapsError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.MapsError[__status]
  }
}

class TranscriberError extends DefaultError {
  constructor (__funcName, __status) {
    super(__funcName, __status)
    this.description = __ERRLIB.TranscriberError[__status]
  }
}

const isInstancesOf = (e) => {
  return (e instanceof SignerError ||
    e instanceof SessionError ||
    e instanceof FireError ||
    e instanceof MethodsError ||
    e instanceof MapsError ||
    e instanceof TranscriberError)
}

module.exports = {
  MethodsError,
  SignerError,
  SessionError,
  FireError,
  MapsError,
  TranscriberError,
  isInstancesOf
}
