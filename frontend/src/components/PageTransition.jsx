import React from 'react';
import { motion } from 'framer-motion';

/**
 * 페이지 전환 애니메이션 컴포넌트
 * Framer Motion을 사용하여 페이지 간 전환 효과를 적용합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 애니메이션을 적용할 자식 컴포넌트
 * @param {string} props.keyValue - 애니메이션을 트리거할 고유 키 값
 */
const PageTransition = ({ children, keyValue }) => {
  // 페이지 전환 애니메이션 설정
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -10
    }
  };

  // 페이지 전환 타이밍 설정
  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3
  };

  return (
    <motion.div
      key={keyValue}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 