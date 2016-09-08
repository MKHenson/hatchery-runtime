namespace HatcheryRuntime {

    /**
     * The Asset behaviour simply acts as a holder of variables.
     */
    export class AssetBehaviour extends Behaviour {

        constructor( runtime: Runtime ) {
            super( runtime );
        }

        /**
         * Clones the behaviour
         * @param {Behaviour} val [Optional] The child parent clone
         */
        clone( val?: Behaviour ): Behaviour {
            return super.clone( new AssetBehaviour( this.runtime ) );
        }

        /**
         * Called after a parameter has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled( parameter: Portal ) {

            super.parameterFilled( parameter );
            this.products[ 0 ].value = this.parameters[ 0 ].value;

            if ( this.parameters[ 0 ].dataType === 'asset' ) {
                const a = this.runtime.getAsset( this.parameters[ 0 ].value );
                this.products[ 0 ].value = a;
            }
            else if ( this.parameters[ 0 ].dataType === 'group' ) {
                const g = this.runtime.getGroup( this.parameters[ 0 ].value );
                this.products[ 0 ].value = g;
            }
            else
                this.products[ 0 ].value = this.parameters[ 0 ].value;
        }

        /**
         * Adds a portal to this behaviour.
         * @param {PortalType} type The type of portal we are adding.
         * @param {string} name The unique name of the {Portal}
         * @param {any} value The default value of the {Portal}
         * @param {DataType} dataType The data type that the portal value represents.
         * @returns {Portal} The portal that was added to this node
         */
        addPortal( type: PortalType, name: string, value: any, dataType: DataType ): Portal {

            const toRet = super.addPortal( type, name, value, dataType );

            if ( this.parameters.length > 0 && this.products.length > 0 ) {
                if ( this.parameters[ 0 ].dataType === 'asset' ) {
                    const tempAsset: Asset = this.runtime.getAsset( this.parameters[ 0 ].value );
                    this.products[ 0 ].value = tempAsset;
                }
                else
                    this.products[ 0 ].value = this.parameters[ 0 ].value;
            }

            return toRet;
        }
    }
}
