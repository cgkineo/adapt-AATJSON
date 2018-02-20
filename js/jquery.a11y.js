define(function() {

        // JQUERY SELECTORS
        var domSelectors = {
            "wrapIgnoreElements": "a,button,input,select,textarea",
            "wrapStyleElements": "b,i,abbr,strong,em,small,sub,sup,ins,del,mark"
        };

        // UTILITY FUNCTIONS
        function stringTrim(str) {
          return str.replace(stringTrim.regex, '');
        }
        stringTrim.regex = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;


        //PERFORMS CALCULATIONS TO TURN HTML/TEXT STRINGS INTO TABBABLE CONTENT
        /**
         * Re written to group child nodes according to their readability
         * @param  {string} text any html string
         * @return {string}      returns html string with tabbable wrappers where appropriate
         */
        function makeHTMLOrTextAccessible(text) {

            return getInnerHTML( makeChildNodesAccessible( wrapInDivAndMakeIntoDOMNode(text) ) );

            function wrapInDivAndMakeIntoDOMNode(text) {
                var $element;
                try {
                    // CONVERT ELEMENT TO DOM NODE
                    $element = $("<div>"+text+"</div>");
                } catch (e) {
                    throw e;
                }
                return $element;
            }

            function getInnerHTML($element) {
                var rtn = "";
                for (var i = 0; i < $element[0].children.length; i++) {
                    rtn += $element[0].children[i].outerHTML;
                }
                return rtn;
            }

            function makeChildNodesAccessible($element) {
                //CAPTURE DOMNODE CHILDREN
                var children = $element.children();


                if (children.length === 0) {
                    //IF NO CHILDREN, ASSUME TEXT ONLY, WRAP IN SPAN TAG
                    var textContent = $element.text();
                    if (stringTrim(textContent) === "") return $element;
                    removeChildNodes($element);
                    $element.append( makeElementTabbable($("<span>"+textContent+"</span>")) );
                    return $element;
                }


                //IF ONLY STYLE TAGS WRAP IN SPAN
                var styleChildCount = 0;
                for (var c = 0; c < children.length; c++) {
                    if ($(children[c]).is(domSelectors.wrapStyleElements)) styleChildCount++;
                }
                if (styleChildCount === children.length) {
                    return $("<span>").append(makeElementTabbable($element));
                }

                //SEARCH FOR TEXT ONLY NODES AND MAKE TABBABLE
                var newChildren = [];
                var newCluster = [];
                for (var i = 0; i < $element[0].childNodes.length; i++) {
                    var child = $element[0].childNodes[i];
                    var cloneChild = $(child.outerHTML)[0];
                    switch(child.nodeType) {
                    case 3: //TEXT NODE
                        //IF TEXT NODE WRAP IN A TABBABLE SPAN
                        if (!stringTrim(child.textContent)) break;
                        newCluster.push( child.textContent );
                        break;
                    case 1: //DOM NODE
                        var $child = $(cloneChild);
                        if ($child.is(domSelectors.wrapStyleElements) || $child.is(domSelectors.wrapIgnoreElements)) {
                            //IGNORE NATIVELY TABBABLE ELEMENTS AND STYLING ELEMENTS
                            newCluster.push( $child[0].outerHTML );
                        } else {
                            var childChildren = $child.children();
                            if (childChildren.length === 0) {
                                //DO NOT DESCEND INTO TEXT ONLY NODES
                                var textContent = $child.text();
                                if (stringTrim(textContent) !== "") makeElementTabbable($child);
                            } else {
                                //DESCEND INTO NODES WITH CHILDREN
                                makeChildNodesAccessible($child);
                            }
                            if (newCluster.length) {
                                newChildren.push(makeElementTabbable($("<span>"+newCluster.join("")+"</span>")))
                                newCluster.length = 0;
                            }
                            newChildren.push( $child );
                        }
                        break;
                    }
                }
                if (newCluster.length) {
                    newChildren.push(makeElementTabbable($("<span>"+newCluster.join("")+"</span>")))
                    newCluster.length = 0;
                }

                removeChildNodes($element);
                $element.append(newChildren);

                return $element;

                function removeChildNodes($element) {
                    var childNodes = $element[0].childNodes.length;
                    for (var i = childNodes - 1; i > -1 ; i--) {
                        if ($element[0].childNodes[i].remove) $element[0].childNodes[i].remove();
                        else if ($element[0].removeChild) $element[0].removeChild($element[0].childNodes[i]); //safari fix
                        else if ($element[0].childNodes[i].removeNode) $element[0].childNodes[i].removeNode(true); //ie 11 fix
                    }
                    return $element;
                }

                //MAKES AN ELEMENT TABBABLE
                function makeElementTabbable($element) {
                    $element.attr({
                        "role": "region",
                        "tabindex": 0,
                    }).addClass("prevent-default");
                    return $element;
                }
            }
        }

        //CONVERTS HTML OR TEXT STRING TO ACCESSIBLE HTML STRING
        $.a11y_text = function (text) {
            var options = $.a11y.options;

            if (!options.isTabbableTextEnabled) return text;

            return makeHTMLOrTextAccessible(text)
        };

        //CONVERTS DOM NODE TEXT TO ACCESSIBLE DOM NODES
        $.fn.a11y_text = function(text) {
            var options = $.a11y.options;

            if (!options.isTabbableTextEnabled) {
                if (text) {
                    this.html(text);
                }

                return this;
            }

            for (var i = 0; i < this.length; i++) {
                // If an argument is given then convert that to accessible text
                // Otherwise convert existing content
                text = text || this[i].innerHTML;
                this[i].innerHTML = makeHTMLOrTextAccessible(text);
            }
            return this;
        };

});