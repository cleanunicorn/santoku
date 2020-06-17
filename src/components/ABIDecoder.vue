<template>
  <div>
    <form @submit.prevent="decode">
      <div class="form-group">
        <label for="abiEncoded">Encoded ABI</label>
        <input
          type="text"
          class="form-control text-monospace"
          id="abiEncoded"
          aria-describedby="abiEncodedHelp"
          v-model="encodedABI"
        >
        <small
          id="abiEncodedHelp"
          class="form-text text-muted"
        >Add the ABI encoded
          hex
          (i.e. <span class="text-monospace">0x11223344</span>).</small>
      </div>

      <div class="form-group">
        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="decodeMethod"
            id="decodeMethod1"
            value="typeList"
            checked
            v-model="decodeMethod"
          >
          <label
            class="form-check-label"
            for="decodeMethod1"
          >
            Type list
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="decodeMethod"
            id="decodeMethod2"
            value="ABI"
            v-model="decodeMethod"
          >
          <label
            class="form-check-label"
            for="decodeMethod2"
          >
            ABI
          </label>
        </div>

        <div class="form-check">
          <input
            class="form-check-input"
            type="radio"
            name="decodeMethod"
            id="decodeMethod3"
            value="4byteDirectory"
            v-model="decodeMethod"
          >
          <label
            class="form-check-label"
            for="decodeMethod3"
          >
            4byte Directory API
          </label>
        </div>
      </div>

      <div
        class="form-group"
        v-if="decodeMethod == 'typeList'"
      >
        <label for="typesArrayString">Types</label>
        <input
          type="text"
          class="form-control"
          id="typesArrayString"
          aria-describedby="typesArrayStringHelp"
          v-model="typesArrayString"
        >
        <small
          id="typesArrayStringHelp"
          class="form-text text-muted"
        >
          i.e.
          <span>bool</span>,
          <span>int</span>,
          <span>uint</span>,
          <span>address</span>,
          <span>bytes</span>,
          <span>string</span>.
          <a
            href="https://solidity.readthedocs.io/en/latest/types.html"
            class="badge badge-info"
          >See full list</a>
        </small>
      </div>

      <template v-if="decodeMethod == 'ABI'">
        <div class="form-group">
          <label for="ABITextarea">ABI</label>
          <textarea
            class="form-control text-monospace"
            id="ABITextarea"
            rows="5"
            v-model="abi"
          />
        </div>

        <div class="form-group">
          <label for="elementType">Element type (function, constructor, event)</label>
          <select
            class="form-control"
            id="elementType"
            v-model="abiSelectedElementType"
          >
            <template v-for="el in abiElementTypes">
              <option :key="`abi-${el}`">
                {{ el }}
              </option>
            </template>
          </select>
        </div>

        <div class="form-group">
          <label for="elementType">Select item</label>
          <select
            class="form-control"
            id="elementType"
            v-model="abiSelectedItem"
          >
            <template v-for="(abiItem, index) in abiElementTypeOptions">
              <option
                :key="`abiItem-${index}`"
                :value="abiItem"
              >
                {{ abiItem.name }}
                <!-- Arguments -->
                (
                <template v-for="(input, inputIndex) in abiItem.inputs">
                  {{ input.type }} {{ input.name }}<template
                    v-if="inputIndex + 1 < abiItem.inputs.length"
                  >
                    ,
                  </template>
                </template>
                )
              </option>
            </template>
          </select>
        </div>
      </template>

      <template>
        <div
          class="form-group"
          v-if="decodeMethod == '4byteDirectory'"
        >
          <label for="typesArrayString">Results</label>
          <template v-if="fourByteRequestLoading">
            <div>
              <div
                class="spinner-border text-primary"
                role="status"
              >
                <span class="sr-only">Loading...</span>
              </div>
            </div>
          </template>
          <template v-else-if="fourByteResults.length">
            <select
              class="form-control"
              id="resultsSelect"
              v-model="fourByteSelected"
            >
              <template v-for="(fourByteItem, index) in fourByteResults">
                <option
                  :key="`fourByteItem-${index}`"
                  selected
                >
                  {{ fourByteItem.text_signature }}
                </option>
              </template>
            </select>
          </template>
          <template v-else>
            <input
              class="form-control"
              type="text"
              placeholder="Function signature was not found"
              readonly
            >
          </template>
        </div>
      </template>

      <button
        type="submit"
        class="btn btn-primary btn-lg btn-block"
      >
        Decode
      </button>
    </form>

    <div class="row mb-3">
      <div class="col-sm">
        <div class="row mb-3">
          <div
            class="col-sm"
            v-if="(strippedFunctionSignature == false) || (strippedFunctionSignature == true)"
          >
            Stripped function signature: <span
              class="text-monospace"
            >{{ strippedFunctionSignature }}</span>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-sm">
            <div class="text-monospace">
              <table
                class="table"
                v-if="decoded.length > 0"
              >
                <thead>
                  <tr>
                    <th scope="col">
                      #
                    </th>
                    <th scope="col">
                      Argument
                    </th>
                    <th scope="col">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="decodedItem in decoded">
                    <tr :key="decodedItem.index">
                      <td scope="row">
                        {{ decodedItem.index }}
                      </td>
                      <td scope="row">
                        {{ decodedItem.argument }}
                      </td>
                      <td
                        scope="row"
                        v-if="(decodedItem.argument.startsWith('uint') || decodedItem.argument.startsWith('int'))"
                      >
                        {{ decodedItem.value.toString(10) }}<sub>10</sub>
                        (0x{{ decodedItem.value.toString(16) }}<sub>16</sub>)
                      </td>
                      <td
                        scope="row"
                        v-else
                      >
                        {{ decodedItem.value }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';

export default {
  name: 'ABIDecoder',
  props: {},
  async beforeCreate() {
    this.web3 = new Web3(Web3.givenProvider);
    this.BN = this.web3.utils.BN;
    this.fourByteDirectoryUrl = 'https://www.4byte.directory/api/v1/signatures/?hex_signature=';
  },
  watch: {
    abi: {
      handler(val) {
        this.abiObject = JSON.parse(val);

        // Compute unique types of abi elements
        const abiElementTypes = [];
        for (let abiItemIndex = 0; abiItemIndex < this.abiObject.length; abiItemIndex += 1) {
          const abiItem = this.abiObject[abiItemIndex];
          if (!abiElementTypes.includes(abiItem.type)) {
            abiElementTypes.push(abiItem.type);
          }
        }
        this.abiElementTypes = abiElementTypes;

        // Try to identify the input based on the function signature
        this.matchFunctionSignature(this.abiObject, this.encodedABI);
      },
      immediate: true,
    },
    abiSelectedElementType: {
      handler(val) {
        const abiElementTypeOptions = [];

        for (let abiItemIndex = 0; abiItemIndex < this.abiObject.length; abiItemIndex += 1) {
          if (this.abiObject[abiItemIndex].type === val) {
            abiElementTypeOptions.push(this.abiObject[abiItemIndex]);
          }
        }

        // Sort by name
        abiElementTypeOptions.sort((a, b) => {
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          return 0;
        });

        this.abiElementTypeOptions = abiElementTypeOptions;

        // Try to identify the input based on the function signature
        this.matchFunctionSignature(this.abiObject, this.encodedABI);
      },
      immediate: true,
    },
    decodeMethod: {
      async handler(val) {
        if (val === '4byteDirectory') {
          this.fourByteRequestLoading = true;

          const funcSigResult = this.extractFunctionSignature(this.encodedABI);
          if (!funcSigResult.found) {
            // Display error
            console.log('Implement `!funcSigResult.found`');
            return;
          }

          const funcSig = funcSigResult.functionSignature;
          const requestResult = await this.$http.get(this.fourByteDirectoryUrl + funcSig);
          this.fourByteResults = requestResult.data.results;

          this.fourByteRequestLoading = false;
        }
      },
    },
  },
  data() {
    return {
      // Inputs
      encodedABI: '0xa9059cbb000000000000000000000000df7a506f2d6af5c0a47b873bb51526819997beab0000000000000000000000000000000000000000000000000000000010103e60',

      // Type list
      typesArrayString: 'address to, uint value',

      // ABI
      abi: '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]',
      abiObject: [],

      // 4 byte Directory
      fourByteResults: [],
      fourByteSelected: {},
      fourByteRequestLoading: false,

      abiElementTypes: [],
      abiSelectedElementType: 'function',
      abiElementTypeOptions: [],
      abiSelectedItem: {},

      // Decode type
      decodeMethod: 'typeList',

      // Outputs
      strippedFunctionSignature: false,
      decoded: [],
    };
  },
  methods: {
    decode() {
      // Clear output
      this.strippedFunctionSignature = null;
      this.decoded = [];

      switch (this.decodeMethod) {
        case 'typeList': {
          const typesArray = this.typesArrayToParamsArray(this.typesArrayString);

          this.decoded = this.web3.eth.abi.decodeParameters(
            typesArray,
            this.stripEncodedABI(this.encodedABI),
          );

          this.decoded = this.zipTypesValues(
            typesArray,
            this.decoded,
          );
          break;
        }
        case 'ABI': {
          const decoded = this.web3.eth.abi.decodeParameters(
            this.abiSelectedItem.inputs,
            this.stripEncodedABI(this.encodedABI),
          );

          for (let i = 0; i < this.abiSelectedItem.inputs.length; i += 1) {
            const zippedItem = {
              index: i,
              argument: `${this.abiSelectedItem.inputs[i].type} ${this
                .abiSelectedItem.inputs[i].name}`,
              value: decoded[i],
            };

            this.decoded.push(zippedItem);
          }
          break;
        }
        case '4byteDirectory': {
          const args = this.fourByteResultToArgumentArray(this.fourByteSelected);

          const decodedParams = this.web3.eth.abi.decodeParameters(
            args,
            this.stripEncodedABI(this.encodedABI),
          );

          const decodedFourByteDirectory = [];

          for (let i = 0; i < args.length; i += 1) {
            const zippedItem = {
              index: i,
              argument: args[i],
              value: decodedParams[i],
            };

            decodedFourByteDirectory.push(zippedItem);
          }
          this.decoded = decodedFourByteDirectory;
          break;
        }
        default:
          break;
      }
    },

    // Internal functions
    typesArrayToParamsArray(typesArrayString) {
      const types = typesArrayString.split(',');

      const paramsArray = [];

      for (let i = 0; i < types.length; i += 1) {
        const type = types[i].trim();
        paramsArray.push(type);
      }

      return paramsArray;
    },
    stripEncodedABI(ABIString) {
      let ABIStringTemp = ABIString;

      if (ABIStringTemp.startsWith('0x')) {
        ABIStringTemp = ABIStringTemp.substring(2);
      }

      this.strippedFunctionSignature = false;
      if (ABIStringTemp.length % 64 !== 0) {
        ABIStringTemp = ABIStringTemp.substring(8);
        this.strippedFunctionSignature = true;
      }

      return `0x${ABIStringTemp}`;
    },
    extractFunctionSignature(ABIString) {
      let functionSignature = '';
      let ABIStringTemp = ABIString;

      if (ABIStringTemp.startsWith('0x')) {
        ABIStringTemp = ABIStringTemp.substring(2);
      }

      if (ABIStringTemp.length % 64 !== 0) {
        functionSignature = ABIStringTemp.substring(0, 8);
        return {
          found: true,
          functionSignature,
        };
      }

      return {
        found: false,
        functionSignature: '',
      };
    },
    fourByteResultToArgumentArray(fourByteResult) {
      let args = /\( *([^)]+?) *\)/.exec(fourByteResult);

      if (args[1]) {
        args = args[1].split(/\s*,\s*/);
      }

      return args;
    },
    zipTypesValues(typesArray, valuesArray) {
      const zipped = [];

      for (let i = 0; i < typesArray.length; i += 1) {
        const index = i + 1;
        const argument = typesArray[i];
        let value = valuesArray[i];

        if (argument.startsWith('uint') || argument.startsWith('int')) {
          value = new this.BN(value);
        }

        zipped.push({
          index,
          argument,
          value,
        });
      }

      return zipped;
    },
    matchFunctionSignature(abiObject, encodedInput) {
      for (let i = 0; i < abiObject.length; i += 1) {
        if (encodedInput.startsWith(this.web3.eth.abi.encodeFunctionSignature(abiObject[
          i]))) {
          this.abiSelectedItem = abiObject[i];
          return;
        }
      }
    },
  },
};

</script>
