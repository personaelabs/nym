import wasm, { init } from '../wasm';
import { Profiler } from './profiler';
import {
  loadCircuit,
  deserializeNymAttestation,
  toTypedNymCode,
  eip712MsgHash,
  serializePublicInput,
  toTypedContentMessage,
} from '../utils';
import { Content, NymProofAuxiliary, PublicInput } from '../lib';
import {
  verifyEffEcdsaPubInput,
  PublicInput as EffEcdsaPubInput,
  CircuitPubInput,
} from '@personaelabs/spartan-ecdsa';

// NOTE: we'll subsidize storage of these files for now
const CIRCUIT_URL =
  'https://storage.googleapis.com/personae-proving-keys/nym/nym_ownership.circuit';

export type VerifierConfig = {
  circuitUrl?: string;
  enableProfiler?: boolean;
};

export class NymVerifier extends Profiler {
  circuit: string;
  constructor(options: VerifierConfig) {
    super({ enabled: options?.enableProfiler });

    this.circuit = options.circuitUrl || CIRCUIT_URL;
  }

  async initWasm() {
    await init();
  }

  verifyPublicInput(
    content: Content,
    nymCode: Buffer,
    publicInput: PublicInput,
    auxiliary: NymProofAuxiliary,
  ): boolean {
    let isNymSigPubInputValid;

    try {
      const typedNymCode = toTypedNymCode(nymCode.toString('utf8'));
      const typedNymCodeHash = eip712MsgHash(
        typedNymCode.domain,
        typedNymCode.types,
        typedNymCode.value,
      );

      const nymSigPublicInput = new EffEcdsaPubInput(
        auxiliary.nymSigR,
        auxiliary.nymSigV,
        typedNymCodeHash,
        new CircuitPubInput(
          publicInput.root,
          publicInput.nymSigTx,
          publicInput.nymSigTy,
          publicInput.nymSigUx,
          publicInput.nymSigUy,
        ),
      );
      isNymSigPubInputValid = verifyEffEcdsaPubInput(nymSigPublicInput);
    } catch (_e) {
      isNymSigPubInputValid = false;
    }

    let isContentSigPubInputValid;
    try {
      const typedContentMessage = toTypedContentMessage(content.contentMessage);

      const typedContentMessageHash = eip712MsgHash(
        typedContentMessage.domain,
        typedContentMessage.types,
        typedContentMessage.value,
      );

      const contentMessageSigPublicInput = new EffEcdsaPubInput(
        auxiliary.contentSigR,
        auxiliary.contentSigV,
        typedContentMessageHash,
        new CircuitPubInput(
          publicInput.root,
          publicInput.contentSigTx,
          publicInput.contentSigTy,
          publicInput.contentSigUx,
          publicInput.contentSigUy,
        ),
      );
      isContentSigPubInputValid = verifyEffEcdsaPubInput(contentMessageSigPublicInput);
    } catch (_e) {
      isContentSigPubInputValid = false;
    }

    return isNymSigPubInputValid && isContentSigPubInputValid;
  }

  async verify(content: Content): Promise<boolean> {
    this.time('Load circuit');
    const circuitBin = await loadCircuit(this.circuit);
    this.timeEnd('Load circuit');

    const { nymCode, proof, publicInput, auxiliary } = deserializeNymAttestation(
      content.attestation,
    );

    this.time('Verify public input');
    const isPublicInputValid = this.verifyPublicInput(
      content,
      Buffer.from(nymCode, 'utf-8'),
      publicInput,
      auxiliary,
    );
    this.timeEnd('Verify public input');

    this.time('Verify proof');
    let isProofValid;
    try {
      isProofValid = await wasm.verify(circuitBin, proof, serializePublicInput(publicInput));
    } catch (_e) {
      isProofValid = false;
    }

    this.timeEnd('Verify proof');
    return isProofValid && isPublicInputValid;
  }
}
