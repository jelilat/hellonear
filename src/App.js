import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default function App() {
  // use React Hooks to store name in component state
  const [name, set_name] = React.useState()
  const [image, setImage] = React.useState({
    src: require('./assets/great.png') // default image
  })

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // window.contract is set by initContract in index.js
        window.contract.get_name({ account_id: window.accountId })
          .then(nameFromContract => {
            set_name(nameFromContract)
          })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1 className="welcome"></h1>
        <h2 style={{ textAlign: 'center'}}>Welcome to my NEAR Dapp!</h2>
        <p>
          To make use of this dapp, you need to click on the sign in button. The button
          below will sign you in using your NEAR testnet wallet.
        </p>
        <p>
          If you don't already have a NEAR testnet wallet, you can create one <a href="https://wallet.testnet.near.org" target="_blank">here</a>.
        </p>
        <p>
          Go ahead and click the button below to try it out:
        </p>
        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <img className="main-image" src={image.src} alt="Great!" 
            style={{
              margin: '0 auto',
            }} />
        <h1 className="main">
            {name && `Hello `}
          <label
            htmlFor="name"
            style={{
              color: 'var(--secondary)',
              borderBottom: '2px solid var(--secondary)'
            }}
          > {name}
          </label> {name && ` !`}
          {' '/* React trims whitespace around tags; insert literal space character when needed */}
          {/* {window.accountId}! */}
          {!name && <label id="greatLabel">You're in 🥳 Great job!</label>}
        </h1>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset, name } = event.target.elements

          // hold onto new user-entered value from React's SynthenticEvent for use after `await` call
          const newName = name.value

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.set_name({
              // pass the value that the user entered in the name field
              message: newName
            })
            .then(() => {
               const mainImage = document.getElementsByClassName('main-image')[0];
               mainImage.src = require('./assets/hello.png');
            })
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
          }

          // update local `name` variable to match persisted value
          set_name(newName)

          //update image
          setImage({
            src: require('./assets/hello.png')
          })

          // show Notification
          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          <fieldset id="fieldset">
            <label
              htmlFor="name"
              style={{
                display: 'block',
                color: 'var(--gray)',
                marginBottom: '0.5em'
              }}
            >
              My name is Tjelailah, what's yours?
            </label>
            <div style={{ display: 'flex' }}>
              <input
                autoComplete="off"
                defaultValue={name}
                id="name"
                onChange={e => setButtonDisabled(e.target.value === name)}
                style={{ flex: 1 }}
              />
              <button
                disabled={buttonDisabled}
                style={{ borderRadius: '0 5px 5px 0' }}
              >
                Respond
              </button>
            </div>
          </fieldset>
        </form>
        <div style={{ textAlign: 'center' }}>
          <p>Created by <a href="http://twitter.com/tjelailah">tjelailah</a> with love ❤️</p>
          <p><a href="https://github.com/jelilat/hellonear/">Github</a></p>
        </div>
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'set_name' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
