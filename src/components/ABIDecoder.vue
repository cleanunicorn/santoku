<template>
    <div>
        <form v-on:submit.prevent="decode">
            <div class="form-group">
                <label for="abiEncoded">Encoded ABI</label>
                <input type="text" class="form-control text-monospace" id="abiEncoded"
                    aria-describedby="abiEncodedHelp" v-model="encodedABI">
                <small id="abiEncodedHelp" class="form-text text-muted">Add the ABI encoded
                    hex
                    (i.e. <span class="text-monospace">0x11223344</span>).</small>
            </div>

            <div class="form-group">

                <div class="form-check">
                    <input class="form-check-input" type="radio" name="decodeMethod"
                        id="decodeMethod1" value="typeList" checked v-model="decodeMethod">
                    <label class="form-check-label" for="decodeMethod1">
                        Type list
                    </label>
                </div>

                <div class="form-check">
                    <input class="form-check-input" type="radio" name="decodeMethod"
                        id="decodeMethod2" value="ABI" v-model="decodeMethod">
                    <label class="form-check-label" for="decodeMethod2">
                        ABI
                    </label>
                </div>

            </div>

            <div class="form-group" v-if="decodeMethod == 'typeList'">
                <label for="typesArrayString">Types</label>
                <input type="text" class="form-control" id="typesArrayString"
                    aria-describedby="typesArrayStringHelp" v-model="typesArrayString">
                <small id="typesArrayStringHelp" class="form-text text-muted">
                    Choose from:
                    <span class="text-monospace">bool</span>,
                    <span class="text-monospace">int</span>,
                    <span class="text-monospace">address</span>,
                    <span class="text-monospace">bytes</span>,
                    <span class="text-monospace">string</span>,
                    <span class="text-monospace">byte</span>.
                </small>
            </div>

            <div v-if="decodeMethod == 'ABI'">
                <div class="form-group">
                    <label for="ABITextarea">ABI</label>
                    <textarea class="form-control text-monospace" id="ABITextarea"
                        rows="5" v-model="abi"></textarea>
                </div>

                <div class="form-group">
                    <label for="elementType">Element type</label>
                    <select class="form-control" id="elementType" v-model="abiSelectedElementType">
                        <template v-for="el in abiElementTypes">
                            <option v-bind:key="'abi-'+el">
                                {{ el }}
                            </option>
                        </template>
                    </select>
                </div>

                <div class="form-group">
                    <label for="elementType">Select</label>
                    <select class="form-control text-monospace" id="elementType">
                        <template v-for="abiItem in abiElementTypeOptions">
                            <option>
                                {{ abiItem.type }}
                                {{ abiItem.name }}
                                <!-- Arguments -->
                                (<template v-for="(input, index) in abiItem.inputs">{{ input.name }}{{ input.type }}<template v-if="index + 1 < abiItem.inputs.length">,</template></template>)
                                <!-- Outputs -->
                                (<template v-for="(output, index) in abiItem.outputs">{{ output.name }}{{ output.type }}<template v-if="index + 1 < abiItem.outputs.length">,</template></template>)
                            </option>
                        </template>
                    </select>
                </div>
            </div>

            <button type="submit" class="btn btn-primary">Decode</button>
        </form>

        <div class="row mb-3">
            <div class="col-sm">
                !!Result!!

                <div class="row mb-3">
                    <div class="col-sm"
                        v-if="(strippedFunctionSignature == false) || (strippedFunctionSignature == true)">
                        Stripped function signature: <span
                            class="text-monospace">{{ strippedFunctionSignature }}</span>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-sm">
                        <div class="text-monospace">
                            <table class="table" v-if="decoded.length > 0">
                                <thead>
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Argument</th>
                                        <th scope="col">Value</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <template v-for="decodedItem in decoded">
                                        <tr v-bind:key="decodedItem.index">
                                            <td scope="row">{{ decodedItem.index }}</td>
                                            <td scope="row">{{ decodedItem.argument }}</td>
                                            <td scope="row"
                                                v-if="(decodedItem.argument.startsWith('uint') || decodedItem.argument.startsWith('int'))">
                                                {{ decodedItem.value.toString(10) }}<sub>10</sub>
                                                (0x{{ decodedItem.value.toString(16) }}<sub>16</sub>)
                                            </td>
                                            <td scope="row" v-else>
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
    export default {
        name: 'ABIDecoder',
        props: {},
        beforeCreate: async function () {
            this.web3 = new Web3(Web3.givenProvider);
            this.BN = this.web3.utils.BN;
        },
        watch: {
            abi: {
                handler: function (val) {
                    this.abiObject = JSON.parse(val)

                    // Compute unique types of abi elements
                    let abiElementTypes = []
                    for (const abiItemIndex in this.abiObject) {
                        let abiItem = this.abiObject[abiItemIndex]
                        if (!abiElementTypes.includes(abiItem.type)) {
                            abiElementTypes.push(abiItem.type)
                        }
                    }
                    this.abiElementTypes = abiElementTypes
                },
                immediate: true,
            },
            abiSelectedElementType: {
                handler: function (val) {
                    let abiElementTypeOptions = []

                    for (const abiItemIndex in this.abiObject) {
                        if (this.abiObject[abiItemIndex].type == val) {
                            abiElementTypeOptions.push(this.abiObject[abiItemIndex])
                        }
                    }

                    this.abiElementTypeOptions = abiElementTypeOptions
                },
                immediate: true,
            },
        },
        data: function () {
            return {
                // Inputs
                encodedABI: '0xa9059cbb000000000000000000000000df7a506f2d6af5c0a47b873bb51526819997beab0000000000000000000000000000000000000000000000000000000010103e60',

                // Type list
                typesArrayString: 'address _to, uint256 _value',

                // ABI
                abi: '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]',
                abiObject: [],

                abiElementTypes: [],
                abiSelectedElementType: 'function',
                abiElementTypeOptions: [],

                // Decode type
                decodeMethod: 'ABI',

                // Outputs
                strippedFunctionSignature: false,
                decoded: [],
            }
        },
        methods: {
            decode() {
                // Clear output
                this.decoded = []
                this.strippedFunctionSignature = null

                let typesArray = this.typesArrayToParamsArray(this.typesArrayString)

                let decoded

                decoded = this.web3.eth.abi.decodeParameters(
                    typesArray,
                    this.stripEncodedABI(this.encodedABI)
                )

                // decoded = this.web3.eth.abi.decodeParameters(
                //     'transfer(address _to, uint256 _value)',
                //     '0xa9059cbb000000000000000000000000df7a506f2d6af5c0a47b873bb51526819997beab0000000000000000000000000000000000000000000000000000000010103e60'
                // )

                this.decoded = this.zipTypesValues(
                    typesArray,
                    decoded
                )
            },
            processABI() {

            },

            // Internal functions
            typesArrayToParamsArray(typesArrayString) {
                let types = typesArrayString.split(',');

                let paramsArray = [];

                for (let i = 0; i < types.length; i++) {
                    let type = types[i].trim();
                    paramsArray.push(type);
                }

                return paramsArray;
            },
            stripEncodedABI(ABIString) {
                if (ABIString.startsWith('0x')) {
                    ABIString = ABIString.substring(2)
                }

                this.strippedFunctionSignature = false;
                if (ABIString.length % 64 != 0) {
                    ABIString = ABIString.substring(8)
                    this.strippedFunctionSignature = true;
                }

                return '0x' + ABIString;
            },
            zipTypesValues(typesArray, valuesArray) {
                let zipped = []

                for (let i = 0; i < typesArray.length; i++) {
                    let index = i + 1;
                    let argument = typesArray[i];
                    let value = valuesArray[i];

                    if (argument.startsWith('uint') || argument.startsWith('int')) {
                        value = new this.BN(value)
                    }

                    zipped.push({
                        index,
                        argument,
                        value,
                    });
                }

                return zipped;
            }
        }
    };

</script>
