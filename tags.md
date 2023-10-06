---
layout: page
headline: Kategorie
title: Zobacz moje wpisy podzielone na kategorie
---

<ul class="list-inline tag-list">
{% assign tags_list = site.tags %}
  {% if tags_list.first[0] == null %}
    {% for tag in tags_list %}
      <li><a href="#{{ tag }}" class='btn btn-default'>{{ tag }} <span class="badge">{{ site.tags[tag].size }}</span></a></li>
    {% endfor %}
  {% else %}
    {% for tag in tags_list %}
      <li><a href="#{{ tag[0] }}" class='btn btn-default'>{{ tag[0] }} <span class="badge">{{ tag[1].size }}</span></a></li>
    {% endfor %}
  {% endif %}
{% assign tags_list = nil %}
</ul>

{% for tag in site.tags %}
  <h2 id="{{ tag[0] }}" class='tag-header'>{{ tag[0] }}</h2>
  <ul class="tag-body">
    {% assign pages_list = tag[1] %}
    {% for post in pages_list %}
      {% if post.title != null %}
      {% if group == null or group == post.group %}
      <li><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}<span class="post-date"><time datetime="{{ post.date | date_to_xmlschema }}" itemprop="datePublished">({{ post.date | date: "%B %d, %Y" }})</time></span></a></li>
      {% endif %}
      {% endif %}
    {% endfor %}
    {% assign pages_list = nil %}
    {% assign group = nil %}
  </ul>
{% endfor %}
