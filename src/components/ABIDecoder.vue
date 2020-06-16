<template>
    <div>
        {{ price }}
        <div class="row mb-3">
            <div class="col-sm">
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

                    <button type="submit" class="btn btn-primary">Decode</button>
                </form>
            </div>
        </div>

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
        data: function () {
            return {
                // Inputs
                encodedABI: '0xa9059cbb000000000000000000000000df7a506f2d6af5c0a47b873bb51526819997beab0000000000000000000000000000000000000000000000000000000010103e60',
                typesArrayString: 'address _to, uint256 _value',

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

                this.decoded = this.zipTypesValues(
                    typesArray,
                    decoded
                )
            },
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
