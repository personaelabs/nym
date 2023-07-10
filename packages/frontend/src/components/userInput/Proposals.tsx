import { Proposal } from '@/hooks/useProposals';
import { Menu } from '@headlessui/react';
import MenuItem from './MenuItem';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '../global/Tooltip';
import { createPortal } from 'react-dom';

interface ProposalProps {
  position: { x: number; y: number };
  proposals: Proposal[] | undefined;
  handleBodyChange: (val: string) => void;
  focusedItem: Proposal | null;
}

enum Status {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUCCEEDED = 'SUCCEEDED',
  QUEUED = 'QUEUED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  DEFEATED = 'DEFEATED',
}

const getStatusColor = (status: string) => {
  if (status === Status.PENDING || status === Status.ACTIVE || status === Status.SUCCEEDED) {
    return 'bg-green-800';
  } else if (status === Status.EXECUTED) return 'bg-[#0E76FD]';
  else if (status === Status.CANCELLED || status === Status.DEFEATED) {
    return 'bg-red-700';
  } else return 'bg-gray-500';
};

export const Proposals = (props: ProposalProps) => {
  const { position, proposals, handleBodyChange, focusedItem } = props;
  const menuItemRef = useRef<HTMLButtonElement>(null);
  const WIDTH = 200;

  //content stores the document or the modal that contains the post content, used for positioning the tooltip
  const [content, setContent] = useState<HTMLElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState<number | null>(null);

  useEffect(() => {
    setContent(document.getElementById('main_modal') || document.body);
    const viewWindow = document.getElementById('modal_window') || document.body;
    setScrollOffset(viewWindow.scrollTop);
  }, [setContent, content]);

  return (
    <>
      {content &&
        scrollOffset !== null &&
        createPortal(
          <Tooltip
            initPosition={{
              top: position.y + scrollOffset,
              left: position.x - content.offsetLeft,
            }}
            maxWidth={WIDTH}
          >
            <Menu
              as={'div'}
              className="flex flex-col bg-white rounded-xl max-w-[200px] border border-gray-100 shadow-md"
            >
              {proposals &&
                proposals.map((p) => (
                  <Menu.Item key={p.id}>
                    <MenuItem
                      ref={menuItemRef}
                      active={p.id === focusedItem?.id}
                      handler={() => {
                        handleBodyChange(p.id);
                      }}
                    >
                      <>
                        <div
                          className={`shrink-0 text-white text-[8px] font-bold px-2 py-0 rounded-md ${getStatusColor(
                            p.status,
                          )}`}
                        >
                          {p.status}
                        </div>
                        <p>#{p.id}</p>
                        <p className="breakText font-semibold">{p.title}</p>
                      </>
                    </MenuItem>
                  </Menu.Item>
                ))}
            </Menu>
          </Tooltip>,
          content,
        )}
    </>
  );
};
