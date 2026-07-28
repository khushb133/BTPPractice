@odata service CatalogService {
  entity Books { 
    key ID:Integer; title:String; author:String;
  }

  function triggerChange() returns String;
} 



