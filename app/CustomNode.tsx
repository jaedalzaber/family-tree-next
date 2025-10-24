import React, { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import { Baby, Heart, Users } from "lucide-react";

const { Top, Bottom, Left, Right } = Position;

const CustomNode = ({ data, addParent, addChild, addSpouse }) => {
  const { isSpouse, isSibling, label, parents, children, spouses } = data;
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const nodeRef = useRef(null);

  const hasParents = !!parents?.length;
  const hasChildren = !!children?.length;
  const hasSiblings = !!data.siblings?.length;
  const hasSpouses = !!spouses?.length;

  const getTargetPosition = () => {
    if (isSpouse) return Left;
    if (isSibling) return Right;
    return Top;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setToolbarVisible((v) => {
      return !v
    });
  }

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (nodeRef.current && !nodeRef.current.contains(e.target)) {
        setToolbarVisible(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  return (
    <div
      className="nodrag"
      onClick={handleClick}
      ref={nodeRef}
      style={{ width: "150px", height: "20px" }}
    >
      {/* NodeToolbar */}
      <div
        style={{
          position: "absolute",
          cursor: "pointer",
          width: "150px",
          height: "60px",
          marginTop: "-10px",
        }}
      >
        <NodeToolbar isVisible={toolbarVisible} position={Position.Bottom} align="center" className="flex gap-2 ">
          {((!isSpouse && !hasParents) || (isSpouse && hasParents)) && <button className="xy-theme__button_dark" title="Add Parents" onClick={(e) => {e.stopPropagation();addParent(data.id)}}>
            <Users className="w-4 h-4" />
          </button>}
          {<button className="xy-theme__button_dark" title="Add Child" onClick={(e) =>{e.stopPropagation(); addChild(data.id)}}>
            <Baby className="w-4 h-4" />
          </button>}
          {(!isSpouse) && <button className="xy-theme__button_dark" title="Add Spouse" onClick={(e) => {e.stopPropagation();addSpouse(data.id)}}>
            <Heart className="w-4 h-4" />
          </button>}
        </NodeToolbar>
      </div>

      {/* Handles */}
      {hasChildren && isSpouse && (
        <Handle type="source" position={Bottom} id={`children-${Bottom}`} style={{ left: "-15px", top: "23px" }} />
      )}

      {hasSpouses &&
        spouses.map((spouseId) => (
          <Handle key={`spouse-${spouseId}`} type="source" position={Right} id={`spouse-${spouseId}`} />
        ))}

      {hasSiblings && <Handle type="source" position={Left} id={`siblings-${Left}`} />}

      {(hasParents || isSpouse || isSibling) && <Handle type="target" position={getTargetPosition()} id={`target-${getTargetPosition()}`} />}

      {/* Node Label */}
      <div>{label}</div>
    </div>
  );
};

CustomNode.displayName = "CustomNode";
export default memo(CustomNode);
