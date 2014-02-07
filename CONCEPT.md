# Concept

Apostrophe should obey this set of rules:

1. Mention lookup is triggered only when a capital letter is entered, and when:
    a. The capital is preceded by a space or the capital is the first character.
    b. The capital is the last character or the capital is followed by a space.

2. After selecting a mention by hitting ENTER or TAB, the mentionned name is turned into a highlighted element in the textarea, **without adding spaces before or after it**.

3. After modifying a mentionned name, apostrophe will try to keep the most parts of it, sequentially comparing parts of a name (by splitting with spaces). Examples:
    a. `Alex John James` will become `Alex John` if the `James` part is modified.
    b. `Alex John James` will become `Alex` if the the `John` part is modified

4. Mention lookup will end when:
  a. Input switches to another word. When mention lookup begins, determine the index of the word that triggered it. If input is detected on a word of a different index, mention lookup will end.

  b. The current word disappears completely (`length==0`).