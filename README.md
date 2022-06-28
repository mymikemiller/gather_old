# Gather

RSVP to gatherings and specify if you can bring any of the requested items.

## Running Locally

```
cd gather
dfx start --background
dfx deploy
```

Navigate to the URL printed out for the `gather_assets` frontend. 

### Running Internet Identity Locally

To use a locally running copy of Internet Identity when logging in to the web
interface for NODE_ENV=development builds (production builds default to using
the actual Internet Identity service), you need to build and start the
[Internet Identity canister](https://github.com/dfinity/internet-identity).
Clone that repository and build and start according to the instructions. The
startup command is duplicated here for convenience but the Internet Identity
readme's command should be used (and this should be updated) if they differ.

Make sure Docker is running, then run this, updating the path to point to your
local copy of internet-identity:

```bash
cd ~/Library/CloudStorage/OneDrive-Personal/Projects/Web/internet-identity/; rm -rf .dfx; II_FETCH_ROOT_KEY=1 dfx build; II_DUMMY_CAPTCHA=1 II_DUMMY_AUTH=1 ./scripts/docker-build
```

Ensure that the value printed out for "Installing code for canister
internet_identity" (also found in
internet-identity/.dfx/local/canister_ids.json under "internet_identity") is
written in webpack.config.js for the development II_URL.

Once that is running locally (and so are this package's canisters), navigating
to http://[local gather_assets cid].localhost:8000 will load the login UI and
authenticating with Internet Identity will redirect to
http://localhost:8000/?canisterId=[internet_identity cid found above]#authorize

## Rebuild canisters

After making changes to canisters, perform the following. This will preserve the state of any variables marked `stable`.

```
dfx build
dfx canister install --all --mode=reinstall
```

## Prerequisites

[Install the DFINITY Canister SDK](https://sdk.dfinity.org/docs/quickstart/quickstart.html#download-and-install)

## Authors

* **Mike Miller** - *Initial work* - [mymikemiller](https://github.com/mymikemiller)
