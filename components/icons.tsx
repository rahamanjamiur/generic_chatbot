import React from 'react';

//insert chatbot svg icon here
export const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#24c8d1" />
    <path d="M12 6V8M9 9H15M8 12C8 10.8954 8.89543 10 10 10H14C15.1046 10 16 10.8954 16 12V14C16 15.1046 15.1046 16 14 16H10C8.89543 16 8 15.1046 8 14V12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10.5" cy="12.5" r="1" fill="white" />
    <circle cx="13.5" cy="12.5" r="1" fill="white" />
    <path d="M10.5 14.5C11 15 13 15 13.5 14.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="#858585" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke="#858585">
    <path d="M452.864,21.312H59.136C26.469,21.312,0,47.781,0,80.448v244.395c0,32.667,26.469,59.136,59.136,59.136H64v85.333 c0,19.006,22.979,28.524,36.418,15.085l100.418-100.418h252.027c32.667,0,59.136-26.469,59.136-59.136V80.448 C512,47.781,485.531,21.312,452.864,21.312z M469.333,324.843c0,9.103-7.366,16.469-16.469,16.469H243.503l6.248-6.248 c8.331-8.331,8.331-21.839,0-30.17c-8.331-8.331-21.839-8.331-30.17,0l-42.666,42.666c0,0,0,0,0,0l-70.248,70.248v-55.163 c0-11.782-9.551-21.333-21.333-21.333H59.136c-9.103,0-16.469-7.366-16.469-16.469V80.448c0-9.103,7.366-16.469,16.469-16.469 h393.728c9.103,0,16.469,7.366,16.469,16.469V324.843z"></path> <path d="M128,149.312c-23.573,0-42.667,19.093-42.667,42.667c0,23.573,19.093,42.667,42.667,42.667 c23.573,0,42.667-19.093,42.667-42.667C170.667,168.405,151.573,149.312,128,149.312z"></path>
    <path d="M256,149.312c-23.573,0-42.667,19.093-42.667,42.667c0,23.573,19.093,42.667,42.667,42.667s42.667-19.093,42.667-42.667 C298.667,168.405,279.573,149.312,256,149.312z"></path> <path d="M384,149.312c-23.573,0-42.667,19.093-42.667,42.667c0,23.573,19.093,42.667,42.667,42.667 c23.573,0,42.667-19.093,42.667-42.667C426.667,168.405,407.573,149.312,384,149.312z"></path>
  </svg>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 0 1 6 0v8.25a3 3 0 0 1-3 3Z" />
  </svg>
);

export const StopCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 0 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

export const VolumeUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

export const VolumeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6.375a9 9 0 0 1 12.728 0M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.28" />
  </svg>
);

// Fix: Add SpinnerIcon component
export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);