<template>
    <div>
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
                                        <tr>
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
    let web3 = new Web3(Web3.givenProvider);
    let BN = web3.utils.BN;

    export default {
        name: 'ABIDecoder',
        props: {},
        data: function () {
            return {
                // Inputs
                encodedABI: '0x0000000000000000000000003225117fbd6bd139be4be8deae9d0aa7825bd2390000000000000000000000003225117fbd6bd139be4be8deae9d0aa7825bd2390000000000000000000000000000000000003008000100000000000000000000',
                typesArrayString: 'address, address, uint',

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

                let typesArray = typesArrayToParamsArray(this.typesArrayString)

                let decoded

                decoded = web3.eth.abi.decodeParameters(
                    typesArray,
                    stripEncodedABI(this.encodedABI)
                )

                this.decoded = zipTypesValues(
                    typesArray,
                    decoded
                )
            }
        }
    };

    function typesArrayToParamsArray(typesArrayString) {
        let types = typesArrayString.split(',');

        let paramsArray = [];

        for (let i = 0; i < types.length; i++) {
            let type = types[i].trim();
            paramsArray.push(type);
        }

        return paramsArray;
    }

    function stripEncodedABI(ABIString) {
        if (ABIString.startsWith('0x')) {
            ABIString = ABIString.substring(2)
        }

        app.strippedFunctionSignature = false;
        if (ABIString.length % 64 != 0) {
            ABIString = ABIString.substring(8)
            app.strippedFunctionSignature = true;
        }

        return '0x' + ABIString;
    }

    function zipTypesValues(typesArray, valuesArray) {
        let zipped = []

        for (let i = 0; i < typesArray.length; i++) {
            let index = i + 1;
            let argument = typesArray[i];
            let value = valuesArray[i];

            if (argument.startsWith('uint') || argument.startsWith('int')) {
                value = new BN(value)
            }

            zipped.push({
                index,
                argument,
                value,
            });
        }

        return zipped;
    }

</script>
