import { Textarea } from './Textarea';
import { useState, useContext, useEffect, useCallback } from 'react';
import { MainButton } from '../MainButton';
import { postDoxed, postPseudo } from '@/lib/actions';
import { useAccount, useSignTypedData } from 'wagmi';
import { PrefixedHex } from '@personaelabs/nymjs';
import { NameSelect } from './NameSelect';
import { ClientName, NameType, UserContextType } from '@/types/components';
import { WalletWarning } from '../WalletWarning';
import { Modal } from '../global/Modal';
import { RetryError } from '../global/RetryError';
import useError from '@/hooks/useError';
import { UserContext } from '@/pages/_app';
import useProver from '@/hooks/useProver';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { postWriter as TEXT } from '@/lib/text';
import { BLACK } from '@/lib/colors';
import useProposals from '@/hooks/useProposals';

interface IWriterProps {
  parentId: PrefixedHex;
  scrollToPost: (id: string) => Promise<void>;
  handleCloseWriter?: () => void;
}

export const PostWriter = (props: IWriterProps) => {
  const { parentId, handleCloseWriter, scrollToPost } = props;
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [closeWriter, setCloseWriter] = useState(false);
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [sendingPost, setSendingPost] = useState(false);
  const [hasSignedPost, setHasSignedPost] = useState(false);
  const [sentPost, setSentPost] = useState(false);
  const [userError, setUserError] = useState('');
  const { errorMsg, isError, setError, clearError } = useError();
  const { proposals } = useProposals();
  const [currProposals, setProposals] = useState(proposals);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showProposals, setShowProposals] = useState(false);

  useEffect(() => {
    setProposals(proposals);
  }, [proposals]);

  const { address } = useAccount();
  const { isMobile, isValid, setPostInProg, postInProg } = useContext(
    UserContext,
  ) as UserContextType;
  const [name, setName] = useState<ClientName | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const signedHandler = () => setHasSignedPost(true);
  const prover = useProver({
    enableProfiler: true,
  });

  const clearErrors = useCallback(() => {
    clearError();
    setUserError('');
  }, [clearError]);

  useEffect(() => {
    setPostInProg(body || title ? true : false);
  }, [setPostInProg, body, title]);

  useEffect(() => {
    // ensure that the writer does not close until postInProg is set to false
    if (!postInProg && closeWriter && handleCloseWriter) {
      handleCloseWriter();
    }
  }, [closeWriter, handleCloseWriter, postInProg]);

  const resetWriter = () => {
    setBody('');
    setTitle('');
    setCloseWriter(true);
  };

  // TODO: Move this logic elsewhere / make it more general.
  const handleBodyChange = (newVal: string) => {
    setShowProposals(false);
    let finalVal = newVal;

    const poundSignIndex = newVal.lastIndexOf('#');
    const spaceIndex = newVal.lastIndexOf(' ');
    // If there are no spaces after the most recent '#'
    if (poundSignIndex !== -1 && spaceIndex < poundSignIndex) {
      const textBeforePoundSign = newVal.substring(0, poundSignIndex + 1);
      const textAfterLastPoundSign = newVal.substring(poundSignIndex + 1);
      // If current proposals have been found and the last character after the '#' was an Enter
      // Replace the text after the last '#' with the prop number.
      if (
        textAfterLastPoundSign.slice(-1).charCodeAt(0) === 10 &&
        currProposals &&
        currProposals.length > 0
      ) {
        finalVal = textBeforePoundSign + `${currProposals[0].id}`;
      } else if (textAfterLastPoundSign === '') {
        // If just '#' sign, show 5 most recent proposals.
        console.log(currProposals?.slice(0, 5));
        setProposals(currProposals?.slice(0, 5));
        setShowProposals(true);
      } else {
        const searchText = textAfterLastPoundSign.toLowerCase();
        // Filter the proposals for titles and prop numbers that match the text after the pound sign.
        const results = proposals
          ?.filter((p) => p.title.toLowerCase().includes(searchText) || p.id.includes(searchText))
          .slice(0, 5);
        console.log(results);
        setProposals(results);
        setShowProposals(true);
      }
    }

    setBody(finalVal);
  };

  const sendPost = async () => {
    if (!address || !isValid) {
      setShowWalletWarning(true);
      return;
    } else {
      setShowWalletWarning(false);
      try {
        clearErrors();
        setSendingPost(true);
        if (!name) {
          setUserError(TEXT.inputError.noName);
          return;
        }
        if (!body) {
          setUserError(TEXT.inputError.noBody);
          return;
        }
        if (parentId === '0x0' && !title) {
          setUserError(TEXT.inputError.noTitle);
          return;
        }
        let result = undefined;
        if (name.type === NameType.DOXED) {
          result = await postDoxed({ title, body, parentId }, signTypedDataAsync, signedHandler);
        } else if (name.type === NameType.PSEUDO && name.name) {
          result = await postPseudo(
            prover,
            name.name,
            name.nymSig,
            { title, body, parentId },
            signTypedDataAsync,
            signedHandler,
          );
        } else {
          setUserError(TEXT.inputError.invalidName);
          return;
        }
        setSentPost(true);
        await scrollToPost(result?.data.postId);
        resetWriter();
      } catch (error) {
        setError(error);
      } finally {
        setSendingPost(false);
        setSentPost(false);
        setHasSignedPost(false);
      }
    }
  };

  return (
    <>
      <WalletWarning
        isOpen={showWalletWarning}
        handleClose={() => setShowWalletWarning(false)}
        action={TEXT.action}
      />
      <Modal isOpen={isError} width="50%" handleClose={clearErrors}>
        <RetryError message={TEXT.fetchError} error={errorMsg} refetchHandler={sendPost} />
      </Modal>
      <div className="flex flex-col gap-2">
        {userError && (
          <p className="error">
            {TEXT.userError} {userError}
          </p>
        )}
        <div className="w-full flex flex-col gap-4 md:gap-6 justify-center items-center">
          <div className="w-full flex flex-col gap-4">
            {parentId === '0x0' ? (
              <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-clip w-full">
                <Textarea
                  value={title}
                  placeholder={TEXT.placeholder.title}
                  minRows={2}
                  onChangeHandler={(newVal) => setTitle(newVal)}
                  setCursorPosition={setCursorPosition}
                  findCursor={showProposals}
                />
              </div>
            ) : null}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-clip w-full">
              <Textarea
                value={body}
                placeholder={
                  parentId === '0x0' ? TEXT.placeholder.newBody : TEXT.placeholder.replyBody
                }
                minRows={4}
                onChangeHandler={handleBodyChange}
                setCursorPosition={setCursorPosition}
                findCursor={showProposals}
              />
            </div>
            {showProposals && (
              <div
                className="absolute bg-white w-10 h-10 rounded-xl"
                style={{ top: cursorPosition.y, left: cursorPosition.x }}
              >
                <p>Test</p>
              </div>
            )}
          </div>
          <div className="w-full flex-wrap flex gap-2 items-center justify-end text-gray-500">
            {address && isValid ? (
              <NameSelect
                openMenuAbove={isMobile && parentId === '0x0'}
                selectedName={name}
                setSelectedName={setName}
              />
            ) : null}
            <MainButton
              color={BLACK}
              handler={sendPost}
              loading={sendingPost}
              message={TEXT.buttonText.before}
              disabled={!body || (parentId === '0x0' && !title)}
            >
              {/* proving only happens for pseudo posts */}
              {hasSignedPost && sendingPost && name && name.type === NameType.PSEUDO ? (
                <p>
                  {TEXT.buttonText.loading}
                  <span className="dot1">.</span>
                  <span className="dot2">.</span>
                  <span className="dot3">.</span>
                </p>
              ) : sentPost ? (
                <div className="flex gap-1 items-center">
                  <p>{TEXT.buttonText.after}</p>
                  <FontAwesomeIcon icon={faCheck} />
                </div>
              ) : null}
            </MainButton>
          </div>
        </div>
      </div>
    </>
  );
};
