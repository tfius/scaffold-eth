
### smail (data from SwarmMail smart contract):
```
"0x973b3f2ad38b1acb64c07dcd3b2d6465157817413a2790f2bcc3dab87ab2b3c1"
from: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
to: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
isEncryption: false
signed: false
swarmLocation: "0x973b3f2ad38b1acb64c07dcd3b2d6465157817413a2790f2bcc3dab87ab2b3c1"
time: BigNumber {_hex: '0x63d3a9b7', _isBigNumber: true}

```


### Processed mail object
```
attachments: [
  {
    file: {
        path: "WorkSans-Medium.ttf"
        type: "font/ttf"
    }, 
    digest: '49d1f4ddae1c2beeeca2bdb3c2433d43f7c6b865434eae8d23223ccf6fbcf760'
  }
]
checked: false
contents: "some longer content with 3 files in attachments\nsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer contentsome longer content"
location: "0x927500d537a5a655cdf4bdfa94b3b40b0c92d8c745da4e739084fa14c4520c82"
recipient: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
sendTime: 1674828189845
sender: "0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419"
subject: "test"
time:BigNumber {_hex: '0x63d3d99a', _isBigNumber: true}
```

## Built with 🏗 Scaffold-ETH

### 🏄‍♂️ Quick Start

### Manual setup

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork 🏗 scaffold-eth:

```bash
git clone https://github.com/austintgriffith/scaffold-eth.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd scaffold-eth
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd scaffold-eth
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd scaffold-eth
yarn deploy
```

🌍 You need an RPC key for production deployments/Apps, create an [Alchemy](https://www.alchemy.com/) account and replace the value of `ALCHEMY_KEY = xxx` in `packages/react-app/src/constants.js`

