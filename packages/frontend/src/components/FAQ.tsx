import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover } from '@headlessui/react';
import { useContext } from 'react';
import { UserContext } from '@/pages/_app';
import { UserContextType } from '@/types/components';
import { Modal } from './global/Modal';
import { FAQContent } from './FAQContent';
import { TransitionFade } from './global/TransitionFade';

export const FAQ = () => {
  const { isMobile } = useContext(UserContext) as UserContextType;

  return (
    <div className="fixed bottom-6 right-6">
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <Popover.Button className="flex gap-2 items-center bg-white rounded-full p-2 md:p-3 border border-gray-200 shadow-md hover:scale-105 active:scale-100 transition-all">
              {isMobile ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <FontAwesomeIcon icon={faQuestion} />
                </div>
              ) : (
                <p>What is this?</p>
              )}
            </Popover.Button>
            {isMobile ? (
              <Modal isOpen={open} handleClose={close}>
                <FAQContent />
              </Modal>
            ) : (
              <TransitionFade duration={100} show={open}>
                <Popover.Panel className="flex flex-col w-[24rem] gap-4 absolute -top-2 left-full -translate-x-full -translate-y-full bg-white p-4 border border-gray-200 shadow-md rounded-xl">
                  <FAQContent />
                </Popover.Panel>
              </TransitionFade>
            )}
          </>
        )}
      </Popover>
    </div>
  );
};
