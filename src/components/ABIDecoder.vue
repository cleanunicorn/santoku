<template>
  <div>
    <div class="row">
      <div class="col">
        <h2>
          Input
        </h2>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <form @submit.prevent="decode">
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="abiEncoded">Encoded ABI</label>
                <input
                  type="text"
                  class="form-control "
                  id="abiEncoded"
                  aria-describedby="abiEncodedHelp"
                  v-model="encodedABI"
                >
                <small
                  id="abiEncodedHelp"
                  class="form-text text-muted"
                >Add the ABI encoded
                  hex
                  (i.e. <span class="">0x11223344</span>).</small>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
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
            </div>
          </div>

          <div class="row">
            <div class="col">
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
            </div>
          </div>

          <template v-if="decodeMethod == 'ABI'">
            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label for="ABITextarea">ABI</label>
                  <textarea
                    class="form-control "
                    id="ABITextarea"
                    rows="5"
                    v-model="abi"
                  />
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col">
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
              </div>
            </div>

            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label for="elementType">Select <strong>{{ abiSelectedElementType }}</strong></label>
                  <select
                    class="form-control"
                    id="elementType"
                    v-model="abiSelectedItem"
                  >
                    <option
                      disabled
                      value="selected"
                    >
                      Pick a {{ abiSelectedElementType }}
                    </option>
                    <template v-for="(abiItem, index) in abiElementTypeOptions">
                      <option
                        :key="`abiItem-${index}`"
                        :value="abiItem"
                      >
                        {{ abiItem.pretty_name }}
                      </option>
                    </template>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <template>
            <div class="row">
              <div class="col">
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
                      <option
                        disabled
                        value="selected"
                      >
                        Pick a matched function
                      </option>
                      <template v-for="(fourByteItem, index) in fourByteResults">
                        <option
                          :key="`fourByteItem-${index}`"
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
              </div>
            </div>
          </template>

          <button
            type="submit"
            class="btn btn-primary btn-lg btn-block"
          >
            Decode
          </button>
        </form>
      </div>
    </div>

    <div class="row pt-5">
      <div class="col">
        <h2>
          Output
        </h2>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div
          class="table-responsive "
          v-if="decoded.length > 0"
        >
          <table
            class="table table-hover"
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
        <h4 v-else>
          No output, click "decode".
        </h4>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';
import example from './example';

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
          const abiItem = this.abiObject[abiItemIndex];

          if (abiItem.type === val) {
            const functionArguments = [];
            for (
              let argumentsIndex = 0;
              argumentsIndex < abiItem.inputs.length;
              argumentsIndex += 1
            ) {
              const itemInput = abiItem.inputs[argumentsIndex];
              functionArguments.push(`${itemInput.type} ${itemInput.name}`);
            }

            abiItem.pretty_name = `${abiItem.name}(${functionArguments.join(', ')})`;
            abiElementTypeOptions.push(abiItem);
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
      handler(val) {
        if (val === '4byteDirectory') {
          this.refreshFourByteSignatures();
        }
      },
    },
    encodedABI: {
      handler() {
        if (this.decodeMethod === '4byteDirectory') {
          this.refreshFourByteSignatures();
        }
      },
    },
  },
  data() {
    return {
      encodedABI: example.encodedABI,

      // Type list
      typesArrayString: example.typesArrayString,

      // ABI
      abi: example.abi,
      abiObject: [],

      // 4 byte Directory
      fourByteResults: [],
      fourByteSelected: 'selected',
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
    async refreshFourByteSignatures() {
      this.fourByteRequestLoading = true;

      const funcSigResult = this.extractFunctionSignature(this.encodedABI);

      const funcSig = funcSigResult.functionSignature;
      const requestResult = await this.$http.get(this.fourByteDirectoryUrl + funcSig);
      this.fourByteResults = requestResult.data.results;

      this.fourByteRequestLoading = false;
    },
  },
};

</script>
